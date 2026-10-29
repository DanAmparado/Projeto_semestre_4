import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import Header from './Header';

type Props = {
  title?: string;
  logo?: boolean;
  showBack?: boolean;
  children: React.ReactNode;
  scroll?: boolean;
  contentStyle?: object;
};

/** Cabeçalho vermelho + conteúdo (rolável por padrão). */
export default function Screen({ title, logo, showBack, children, scroll = true, contentStyle }: Props) {
  return (
    <View style={styles.root}>
      <Header title={title} logo={logo} showBack={showBack} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {scroll ? (
          <ScrollView contentContainerStyle={[styles.content, contentStyle]} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.content, { flex: 1 }, contentStyle]}>{children}</View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, alignItems: 'center', flexGrow: 1 },
});
