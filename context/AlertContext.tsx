import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert, AlertButton, Platform } from 'react-native';
import { Button, Dialog, Portal, Text } from 'react-native-paper';

type ShowAlert = (title: string, message?: string, buttons?: AlertButton[]) => void;
const AlertContext = createContext<ShowAlert>(Alert.alert);
export const useAlert = () => useContext(AlertContext);

export function AlertProvider({ children, sessionId }: React.PropsWithChildren<{ sessionId?: string }>) {
  const [dialog, setDialog] = useState<{ title: string; message?: string; buttons: AlertButton[] } | null>(null);
  useEffect(() => setDialog(null), [sessionId]);
  const show: ShowAlert = (title, message, buttons = [{ text: 'OK' }]) => {
    if (Platform.OS === 'web') setDialog({ title, message, buttons });
    else Alert.alert(title, message, buttons);
  };
  return <AlertContext.Provider value={show}>
    {children}
    {dialog && <Portal>
      <Dialog visible onDismiss={() => setDialog(null)}>
        <Dialog.Title>{dialog.title}</Dialog.Title>
        {!!dialog.message && <Dialog.Content><Text>{dialog.message}</Text></Dialog.Content>}
        <Dialog.Actions style={{ flexWrap: 'wrap' }}>
          {dialog.buttons.map(button => <Button key={button.text} onPress={() => {
            setDialog(null);
            button.onPress?.();
          }}>{button.text}</Button>)}
        </Dialog.Actions>
      </Dialog>
    </Portal>}
  </AlertContext.Provider>;
}
