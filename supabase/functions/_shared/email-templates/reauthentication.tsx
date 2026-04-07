/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="ar" dir="rtl">
    <Head />
    <Preview>رمز التحقق — المدرسة الترتيلية</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src="https://aawstkjrmfxkaxocvpie.supabase.co/storage/v1/object/public/email-assets/logo.jpeg" width="64" height="64" alt="المدرسة الترتيلية" style={logo} />
        <Heading style={h1}>تأكيد الهوية</Heading>
        <Text style={text}>استخدم الرمز أدناه لتأكيد هويتك:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          سينتهي هذا الرمز قريباً. إذا لم تطلبه، يمكنك تجاهل هذه الرسالة بأمان.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Cairo', 'Amiri', Arial, sans-serif" }
const container = { padding: '30px 25px', textAlign: 'right' as const }
const logo = { margin: '0 auto 20px', borderRadius: '12px' }
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: '#3A2414',
  margin: '0 0 20px',
  fontFamily: "'Amiri', 'Cairo', serif",
}
const text = {
  fontSize: '15px',
  color: '#8A7668',
  lineHeight: '1.7',
  margin: '0 0 25px',
}
const codeStyle = {
  fontFamily: 'Courier, monospace',
  fontSize: '28px',
  fontWeight: 'bold' as const,
  color: '#503420',
  margin: '0 0 30px',
  letterSpacing: '4px',
  textAlign: 'center' as const,
}
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
