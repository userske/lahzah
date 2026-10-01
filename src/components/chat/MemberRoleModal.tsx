import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { GlassBlur } from '../ui/GlassCard';
import { X, UserCircle } from 'lucide-react-native';
import { useAppTheme } from '../../hooks/useAppTheme';
import { Fonts } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

interface MemberRoleModalProps {
  visible: boolean;
  onClose: () => void;
  circleId: string;
  memberData: Record<string, { name: string; role: string; custom_title?: string }>;
  onUpdateMember: (userId: string, title: string) => void;
}

export function MemberRoleModal({ visible, onClose, circleId, memberData, onUpdateMember }: MemberRoleModalProps) {
  const { colors, isDark } = useAppTheme();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const membersList = Object.entries(memberData).map(([id, data]) => ({ id, ...data }));

  const handleSave = async (userId: string) => {
    setLoadingId(userId);
    const { error } = await supabase
      .from('circle_members')
      .update({ custom_title: editTitle.trim() || null })
      .eq('circle_id', circleId)
      .eq('user_id', userId);
    
    setLoadingId(null);
    if (!error) {
      onUpdateMember(userId, editTitle.trim());
      setEditingId(null);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <GlassBlur intensity={80} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill}>
        <View style={[styles.container, { backgroundColor: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.95)' }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>Assign Member Titles</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={membersList}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => {
              const isEditing = editingId === item.id;
              
              return (
                <View style={[styles.memberCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.memberInfo}>
                    <UserCircle size={40} color={colors.primary} />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text style={[styles.memberName, { color: colors.text }]}>{item.name}</Text>
                      {!isEditing && (
                        <Text style={[styles.memberTitle, { color: colors.textSecondary }]}>
                          {item.custom_title || item.role}
                        </Text>
                      )}
                    </View>
                  </View>
                  
                  {isEditing ? (
                    <View style={styles.editRow}>
                      <TextInput
                        style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                        value={editTitle}
                        onChangeText={setEditTitle}
                        placeholder="E.g. Sheikh, Teacher..."
                        placeholderTextColor={colors.textTertiary}
                      />
                      <TouchableOpacity
                        style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                        onPress={() => handleSave(item.id)}
                        disabled={loadingId === item.id}
                      >
                        {loadingId === item.id ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Save</Text>}
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[styles.editBtn, { backgroundColor: colors.primaryLight }]}
                      onPress={() => {
                        setEditingId(item.id);
                        setEditTitle(item.custom_title || '');
                      }}
                    >
                      <Text style={[styles.editBtnText, { color: colors.primary }]}>Assign Title</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            }}
          />
        </View>
      </GlassBlur>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 60,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 20,
    fontFamily: Fonts.sansBold,
  },
  closeBtn: {
    padding: 4,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  memberCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  memberName: {
    fontSize: 16,
    fontFamily: Fonts.sansSemiBold,
    marginBottom: 4,
  },
  memberTitle: {
    fontSize: 14,
    fontFamily: Fonts.sans,
  },
  editRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: Fonts.sans,
    fontSize: 14,
  },
  saveBtn: {
    paddingHorizontal: 20,
    justifyContent: 'center',
    borderRadius: 12,
  },
  saveBtnText: {
    color: '#fff',
    fontFamily: Fonts.sansBold,
    fontSize: 14,
  },
  editBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  editBtnText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
  },
});
