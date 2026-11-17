import { useAlert } from '../../context/AlertContext';
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiClient } from '../../services/api';
import { AppointmentItem, Master } from '../../constants/salonTypes';
import { useCurrentUser } from '../../services/authService';
import { useAppSettings } from '../../context/AppSettingsContext';
import { useCamera } from '../../hooks/useCamera';

export default function AppointmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const showAlert = useAlert();
  const router = useRouter();
  const { colors, language } = useAppSettings();
  const pl = language === 'pl';
  const admin = useCurrentUser()?.role === 'ADMIN';
  const [booking, setBooking] = useState<AppointmentItem | null>(null);
  const [masters, setMasters] = useState<Master[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [masterId, setMasterId] = useState('');
  const [date, setDate] = useState('');
  const [start, setStart] = useState('');
  const camera = useCamera();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    let active = true;
    setBooking(null);
    setError('');
    setEditing(false);
    Promise.all([apiClient.getAppointment(id), apiClient.getMasters()]).then(([item, staff]) => {
      if (active) { setBooking(item); setMasters(staff); }
    }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [id]);

  async function update(changes: Parameters<typeof apiClient.updateAppointment>[1]) {
    setBusy(true);
    try {
      setBooking(await apiClient.updateAppointment(id, changes));
      setEditing(false);
    } catch (e) {
      showAlert(pl ? 'Błąd' : 'Помилка', e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const scheduled = booking?.status === 'CONFIRMED';
  const status = booking?.status === 'COMPLETED' ? (pl ? 'Zakończona' : 'Завершено')
    : booking?.status === 'CANCELLED' ? (pl ? 'Anulowana' : 'Скасовано') : (pl ? 'Zaplanowana' : 'Заплановано');

  return (
    <ScrollView style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}>
      <Button onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/calendar')}>
        {pl ? 'Wróć' : 'Назад'}
      </Button>
      {booking ? <>
        <Text variant="headlineSmall" style={{ color: colors.text }}>{booking.serviceName}</Text>
        <Text style={{ color: colors.text }}>{booking.date} · {booking.startTime}–{booking.endTime} · {status}</Text>
        <Text style={{ color: colors.text }}>{booking.clientName} · {booking.clientPhone}</Text>
        <Text style={{ color: colors.text }}>{masters.find(m => m.id === booking.masterId)?.name} · {booking.price} ₴</Text>
        {!!booking.notes && <Text style={{ color: colors.text }}>{booking.notes}</Text>}
        {!!booking.photoUri && !booking.photoUri.startsWith('data:') && <Text style={{ color: colors.text }}>
          {pl ? 'Zdjęcie zapisano na poprzednim urządzeniu. Wybierz je ponownie, aby udostępnić je salonowi.'
            : 'Старе фото збережено на пристрої, де його зробили. Виберіть його повторно, щоб додати до спільного запису.'}
        </Text>}
        {!!booking.photoUri && <Image source={{ uri: booking.photoUri }} style={styles.photo} />}
        <Button disabled={busy || camera.isLoading} onPress={async () => {
          const photoUri = await camera.takePhoto();
          if (photoUri) await update({ photoUri });
        }}>{pl ? 'Zrób zdjęcie' : 'Зробити фото'}</Button>
        <Button disabled={busy || camera.isLoading} onPress={async () => {
          const photoUri = await camera.pickPhotoFromGallery();
          if (photoUri) await update({ photoUri });
        }}>{pl ? 'Wybierz zdjęcie' : 'Вибрати фото'}</Button>
        {scheduled && <Button mode="contained" disabled={busy} onPress={() => update({ status: 'COMPLETED' })}>
          {pl ? 'Zakończ wizytę' : 'Завершити візит'}
        </Button>}
        {admin && scheduled && <>
          <Button disabled={busy} onPress={() => {
            setMasterId(booking.masterId); setDate(booking.date); setStart(booking.startTime);
            setEditing(!editing);
          }}>{pl ? 'Przenieś wizytę' : 'Перенести візит'}</Button>
          {editing && <>
            {masters.filter(m => m.active).map(m => <Button key={m.id}
              mode={m.id === masterId ? 'contained' : 'outlined'} onPress={() => setMasterId(m.id)}>{m.name}</Button>)}
            <TextInput label={pl ? 'Data (YYYY-MM-DD)' : 'Дата (YYYY-MM-DD)'} value={date} onChangeText={setDate} />
            <TextInput label={pl ? 'Godzina (HH:MM)' : 'Час (HH:MM)'} value={start} onChangeText={setStart} />
            <Button disabled={busy} onPress={() => update({ masterId, date, startTime: start })}>
              {pl ? 'Zapisz' : 'Зберегти'}
            </Button>
          </>}
          <Button disabled={busy} onPress={() => showAlert(pl ? 'Anulować wizytę?' : 'Скасувати візит?', '', [
            { text: pl ? 'Nie' : 'Ні', style: 'cancel' },
            { text: pl ? 'Tak' : 'Так', onPress: () => update({ status: 'CANCELLED' }) },
          ])}>{pl ? 'Anuluj wizytę' : 'Скасувати візит'}</Button>
        </>}
      </> : <Text style={{ color: colors.text }}>{error || (pl ? 'Ładowanie…' : 'Завантаження…')}</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 12 },
  photo: { width: '100%', height: 240, borderRadius: 12 },
});
