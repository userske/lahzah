import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Client } from 'npm:@modelcontextprotocol/sdk/client/index.js'
import { SSEClientTransport } from 'npm:@modelcontextprotocol/sdk/client/sse.js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    const assemblyAiKey = Deno.env.get('ASSEMBLYAI_API_KEY')

    if (!openaiKey) {
      throw new Error('Missing OPENAI_API_KEY environment variable.')
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing Authorization header')
    }

    const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
      global: { headers: { Authorization: authHeader } },
    })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    const formData = await req.formData()
    const audioFile = formData.get('audio') as File
    const mode = formData.get('mode')
    const reference = formData.get('reference') // e.g. "surah 1"

    if (!audioFile) throw new Error('No audio file provided')

    let transcript = ''

    if (assemblyAiKey) {
      // 1a. Transcribe using AssemblyAI (Universal-3 Pro)
      const uploadRes = await fetch('https://api.assemblyai.com/v2/upload', {
        method: 'POST',
        headers: {
          'Authorization': assemblyAiKey,
          'Content-Type': 'application/octet-stream'
        },
        body: audioFile
      })
      if (!uploadRes.ok) throw new Error(`AssemblyAI Upload Error: ${await uploadRes.text()}`)
      const { upload_url } = await uploadRes.json()

      const transcriptRes = await fetch('https://api.assemblyai.com/v2/transcript', {
        method: 'POST',
        headers: {
          'Authorization': assemblyAiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          audio_url: upload_url,
          language_code: 'ar'
        })
      })
      if (!transcriptRes.ok) throw new Error(`AssemblyAI Transcript Error: ${await transcriptRes.text()}`)
      const { id } = await transcriptRes.json()

      while (true) {
        await new Promise(resolve => setTimeout(resolve, 1500))
        const pollRes = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
          headers: { 'Authorization': assemblyAiKey }
        })
        const pollData = await pollRes.json()
        if (pollData.status === 'completed') {
          transcript = pollData.text
          break
        } else if (pollData.status === 'error') {
          throw new Error(`AssemblyAI Polling Error: ${pollData.error}`)
        }
      }
    } else {
      // 1b. Transcribe using OpenAI Whisper (or Groq Whisper Large V3 Turbo)
      const whisperFormData = new FormData()
      whisperFormData.append('file', audioFile)
      whisperFormData.append('model', 'whisper-1')
      whisperFormData.append('language', 'ar')

      const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${openaiKey}` },
        body: whisperFormData,
      })

      if (!whisperResponse.ok) {
        throw new Error(`Whisper Error: ${await whisperResponse.text()}`)
      }
      const data = await whisperResponse.json()
      transcript = data.text
    }

    // 2. Connect to Quran AI MCP Server
    const transport = new SSEClientTransport(new URL('https://mcp.quran.ai/sse'))
    const mcpClient = new Client(
      { name: 'lahzah-backend', version: '1.0.0' },
      { capabilities: { tools: {} } }
    )
    await mcpClient.connect(transport)
    
    // Fetch available tools from the MCP server
    const { tools } = await mcpClient.listTools()
    const openaiTools = tools.map(t => ({
      type: "function",
      function: {
        name: t.name,
        description: t.description,
        parameters: t.inputSchema
      }
    }))

    // 3. Ask OpenAI (GPT-4o) to verify the transcript against canonical Quran text via MCP tools
    const systemPrompt = `You are a strict and expert Quran Hifz and Tajweed examiner. 
The user is reciting: ${reference || 'the Quran'}.
Mode: ${mode === 'fluency' ? 'Fluency (checking pronunciation)' : 'Tahfidh (checking memorization)'}.
Your job is to:
1. Use the provided tools to fetch the exact canonical text of the requested reference.
2. Compare the canonical text against the user's transcript.
3. Identify any deviations (skipped words, wrong words, incorrect harakat if obvious).
4. Return a fluency_score out of 100.
IMPORTANT: You must ONLY output a valid JSON object matching this schema, with no other text or markdown formatting:
{
  "fluency_score": 95,
  "deviations": [{"word": "the skipped word", "message": "You missed this word"}]
}`

    let messages: any[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Here is the user's raw Arabic transcription from Whisper: "${transcript}"\nPlease verify it.` }
    ]
    let openaiResponseText

    // Simple manual loop for tool usage (up to 3 iterations to prevent loops)
    for (let i = 0; i < 3; i++) {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages,
          tools: openaiTools,
          response_format: { type: "json_object" }
        })
      })

      if (!res.ok) throw new Error(`OpenAI Chat Error: ${await res.text()}`)
      const payload = await res.json()
      const message = payload.choices[0].message
      
      messages.push(message)

      if (message.tool_calls && message.tool_calls.length > 0) {
        for (const toolCall of message.tool_calls) {
          // Call the MCP Server
          const toolResult = await mcpClient.callTool({
            name: toolCall.function.name,
            arguments: JSON.parse(toolCall.function.arguments)
          })
          
          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(toolResult.content)
          })
        }
      } else {
        // OpenAI finished and returned the JSON text
        openaiResponseText = message.content
        break
      }
    }

    // Close MCP connection
    await transport.close()

    if (!openaiResponseText) throw new Error('OpenAI did not return a valid response')

    const result = JSON.parse(openaiResponseText)

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    console.error('Edge Function Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
