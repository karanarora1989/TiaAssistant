import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
      <SignIn 
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-[#0d0d0d] border border-[#1a1a1a]",
          }
        }}
      />
    </div>
  );
}
