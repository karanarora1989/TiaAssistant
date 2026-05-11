import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
      <SignIn 
        appearance={{
          baseTheme: undefined,
          variables: {
            colorPrimary: '#c9a96e',
            colorBackground: '#0d0d0d',
            colorInputBackground: '#0f0f0f',
            colorInputText: '#e0e0e0',
            colorText: '#e0e0e0',
            colorTextSecondary: '#888888',
            colorDanger: '#d06030',
            colorSuccess: '#4a9a4a',
            colorWarning: '#c9a96e',
            colorNeutral: '#444444',
            borderRadius: '0.5rem',
            fontFamily: 'Inter, system-ui, sans-serif',
          },
          elements: {
            rootBox: 'mx-auto',
            card: 'bg-[#0d0d0d] border border-[#1a1a1a] shadow-xl',
            headerTitle: 'text-[#e0e0e0] font-medium',
            headerSubtitle: 'text-[#888888]',
            socialButtonsBlockButton: 'bg-[#0f0f0f] border border-[#1a1a1a] text-[#e0e0e0] hover:bg-[#111111] hover:border-[#1e1e1e]',
            socialButtonsBlockButtonText: 'text-[#e0e0e0] font-medium',
            formButtonPrimary: 'bg-gradient-to-br from-[#c9a96e] to-[#906030] text-[#0a0a0a] font-medium hover:shadow-lg transition-all',
            formFieldLabel: 'text-[#e0e0e0]',
            formFieldInput: 'bg-[#0f0f0f] border-[#1a1a1a] text-[#e0e0e0] focus:border-[#c9a96e] focus:ring-[#c9a96e]',
            formFieldInputShowPasswordButton: 'text-[#888888] hover:text-[#e0e0e0]',
            footerActionLink: 'text-[#c9a96e] hover:text-[#e0b97e]',
            footerActionText: 'text-[#888888]',
            identityPreviewText: 'text-[#e0e0e0]',
            identityPreviewEditButton: 'text-[#c9a96e] hover:text-[#e0b97e]',
            formResendCodeLink: 'text-[#c9a96e] hover:text-[#e0b97e]',
            otpCodeFieldInput: 'bg-[#0f0f0f] border-[#1a1a1a] text-[#e0e0e0]',
            formFieldSuccessText: 'text-[#4a9a4a]',
            formFieldErrorText: 'text-[#d06030]',
            formFieldWarningText: 'text-[#c9a96e]',
            dividerLine: 'bg-[#1a1a1a]',
            dividerText: 'text-[#888888]',
            formFieldAction: 'text-[#c9a96e] hover:text-[#e0b97e]',
            formFieldHintText: 'text-[#888888]',
            formHeaderTitle: 'text-[#e0e0e0]',
            formHeaderSubtitle: 'text-[#888888]',
            alertText: 'text-[#e0e0e0]',
            alert: 'bg-[#0f0f0f] border-[#1a1a1a]',
          },
        }}
      />
    </div>
  );
}
