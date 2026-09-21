import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { Calendar, Clock } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { Fonts } from '../../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';

export function CreateEventModal({ visible, onClose, circleId, userId, colors }: { visible: boolean; onClose: () => void; circleId: string; userId: string; colors: any }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date'|'time'>('date');
  const [loading, setLoading] = useState(false);

  const createEvent = async () => {
    if (!title.trim()) return Alert.alert('Error', 'Please enter an event title');

    setLoading(true);
    const { data: ev, error: eErr } = await supabase.from('circle_events').insert({
      circle_id: circleId,
      title: title.trim(),
      description: description.trim(),
      event_at: date.toISOString(),
      created_by: userId
    }).select('id').single();

    if (eErr) {
      setLoading(false);
      return Alert.alert('Error', eErr.message);
    }

    // Insert event message
    await supabase.from('circle_messages').insert({
      circle_id: circleId,
      user_id: userId,
      type: 'event',
      content: ev.id
    });

    setLoading(false);
    setTitle('');
    setDescription('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose}><Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text></TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>New Event</Text>
          <TouchableOpacity onPress={createEvent} disabled={loading}>
            {loading ? <ActivityIndicator size="small" color={colors.primary} /> : <Text style={[styles.createText, { color: colors.primary }]}>Create</Text>}
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Event Title</Text>
          <TextInput
            value={title} onChangeText={setTitle} placeholder="e.g. Surah Yasin Study"
            placeholderTextColor={colors.textTertiary}
            style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          />

          <Text style={[styles.label, { color: colors.textSecondary, marginTop: 24 }]}>Description (Optional)</Text>
          <TextInput
            value={description} onChangeText={setDescription} placeholder="Add details..."
            placeholderTextColor={colors.textTertiary}
            style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border, minHeight: 80 }]}
            multiline
          />

          <Text style={[styles.label, { color: colors.textSecondary, marginTop: 24 }]}>Date & Time</Text>
          <View style={styles.dateRow}>
            <TouchableOpacity onPress={() => { setPickerMode('date'); setShowPicker(true); }} style={[styles.dateBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Calendar size={16} color={colors.textSecondary} />
              <Text style={[styles.dateText, { color: colors.text }]}>{date.toLocaleDateString()}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setPickerMode('time'); setShowPicker(true); }} style={[styles.dateBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Clock size={16} color={colors.textSecondary} />
              <Text style={[styles.dateText, { color: colors.text }]}>{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </TouchableOpacity>
          </View>

          {showPicker && (
            <DateTimePicker
              value={date}
              mode={pickerMode}
              display="spinner"
              onChange={(e, d) => {
                setShowPicker(Platform.OS === 'ios'); // Keep open on iOS, close on Android
                if (d) setDate(d);
              }}
              style={{ alignSelf: 'center', marginTop: 20 }}
            />
          )}
          {showPicker && Platform.OS === 'ios' && (
            <TouchableOpacity onPress={() => setShowPicker(false)} style={[styles.doneBtn, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.doneText, { color: colors.primary }]}>Done</Text>
            </TouchableOpacity>
          )}

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
  input: { borderWidth: 1, borderRadius: 12, padding: 16, fontFamily: Fonts.sans, fontSize: 16 },
  dateRow: { flexDirection: 'row', gap: 12 },
  dateBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16, borderWidth: 1, borderRadius: 12 },
  dateText: { fontFamily: Fonts.sansMedium, fontSize: 16 },
  doneBtn: { marginTop: 16, padding: 12, borderRadius: 8, alignItems: 'center' },
  doneText: { fontFamily: Fonts.sansBold, fontSize: 16 },
});
