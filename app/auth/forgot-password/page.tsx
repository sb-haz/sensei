import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { ClientNavbar } from "@/components/ClientNavbar";

export default function Page() {
  return (
    <div className="min-h-screen bg-white">
      <ClientNavbar />

      {/* Hero Background */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 z-0 h-full w-full bg-white [background:radial-gradient(125%_125%_at_50%_0%,#fff_40%,#2563eb_100%)]"></div>
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-white z-10 rounded-t-[100%] transform scale-x-150"></div>
        
        <div className="relative z-10 flex min-h-[80vh] w-full items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Reset password</h1>
              <p className="text-gray-600">Enter your email to receive a reset link</p>
            </div>
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
              <ForgotPasswordForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
