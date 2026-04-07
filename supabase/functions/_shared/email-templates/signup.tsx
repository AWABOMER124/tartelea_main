/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="ar" dir="rtl">
    <Head />
    <Preview>تأكيد بريدك الإلكتروني — المدرسة الترتيلية</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src="https://aawstkjrmfxkaxocvpie.supabase.co/storage/v1/object/public/email-assets/logo.jpeg" width="64" height="64" alt="المدرسة الترتيلية" style={logo} />
        <Heading style={h1}>أهلاً بك في المدرسة الترتيلية</Heading>
        <Text style={text}>
          شكراً لتسجيلك في{' '}
          <Link href={siteUrl} style={link}>
            <strong>المدرسة الترتيلية</strong>
          </Link>
          — منصة اللسان العربي المبين وعلوم القرآن الكريم.
        </Text>
        <Text style={text}>
          يرجى تأكيد بريدك الإلكتروني (
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          ) بالضغط على الزر أدناه:
        </Text>
        <Button style={button} href={confirmationUrl}>
          تأكيد البريد الإلكتروني
        </Button>
        <Text style={footer}>
          إذا لم تقم بإنشاء حساب، يمكنك تجاهل هذه الرسالة بأمان.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

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
const link = { color: '#D4A82E', textDecoration: 'underline' }
const button = {
  backgroundColor: '#503420',
  color: '#F7F2EB',
  fontSize: '15px',
  borderRadius: '14px',
  padding: '14px 28px',
  textDecoration: 'none',
  fontFamily: "'Cairo', 'Amiri', Arial, sans-serif",
}
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
