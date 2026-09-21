import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Plus, X } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { Fonts } from '../../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

export function CreatePollModal({ visible, onClose, circleId, userId, colors }: { visible: boolean; onClose: () => void; circleId: string; userId: string; colors: any }) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [loading, setLoading] = useState(false);

  const addOption = () => setOptions([...options, '']);
  const updateOption = (idx: number, text: string) => {
    const next = [...options];
    next[idx] = text;
    setOptions(next);
  };
  const removeOption = (idx: number) => {
    setOptions(options.filter((_, i) => i !== idx));
  };

  const createPoll = async () => {
    if (!question.trim()) return Alert.alert('Error', 'Please enter a question');
    const validOptions = options.map(o => o.trim()).filter(o => o.length > 0);
    if (validOptions.length < 2) return Alert.alert('Error', 'Please provide at least 2 options');

    setLoading(true);
    const { data: poll, error: pErr } = await supabase.from('circle_polls').insert({
      circle_id: circleId,
      question: question.trim(),
      options: validOptions,
      created_by: userId
    }).select('id').single();

    if (pErr) {
      setLoading(false);
      return Alert.alert('Error', pErr.message);
    }

    // Insert poll message
    await supabase.from('circle_messages').insert({
      circle_id: circleId,
      user_id: userId,
      type: 'poll',
      content: poll.id
    });

    setLoading(false);
    setQuestion('');
    setOptions(['', '']);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose}><Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text></TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>New Poll</Text>
          <TouchableOpacity onPress={createPoll} disabled={loading}>
            {loading ? <ActivityIndicator size="small" color={colors.primary} /> : <Text style={[styles.createText, { color: colors.primary }]}>Create</Text>}
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Question</Text>
          <TextInput
            value={question} onChangeText={setQuestion} placeholder="Ask a question..."
            placeholderTextColor={colors.textTertiary}
            style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
            multiline
          />

          <Text style={[styles.label, { color: colors.textSecondary, marginTop: 24 }]}>Options</Text>
          {options.map((opt, idx) => (
            <View key={idx} style={styles.optionRow}>
              <TextInput
                value={opt} onChangeText={(t) => updateOption(idx, t)} placeholder={`Option ${idx + 1}`}
                placeholderTextColor={colors.textTertiary}
                style={[styles.input, { flex: 1, backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              />
              {options.length > 2 && (
                <TouchableOpacity onPress={() => removeOption(idx)} style={styles.removeBtn}>
                  <X size={20} color={colors.error} />
                </TouchableOpacity>
              )}
            </View>
          ))}
          <TouchableOpacity onPress={addOption} style={styles.addBtn}>
            <Plus size={16} color={colors.primary} />
            <Text style={[styles.addBtnText, { color: colors.primary }]}>Add Option</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  title: { fontFamily: Fonts.sansBold, fontSize: 16 },
  cancelText: { fontFamily: Fonts.sansMedium, fontSize: 16 },
  createText: { fontFamily: Fonts.sansBold, fontSize: 16 },
  content: { padding: 16 },
  label: { fontFamily: Fonts.sansSemiBold, fontSize: 14, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 12, padding: 16, fontFamily: Fonts.sans, fontSize: 16, minHeight: 50 },
  optionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  removeBtn: { padding: 8 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12 },
  addBtnText: { fontFamily: Fonts.sansSemiBold, fontSize: 14 },
});
