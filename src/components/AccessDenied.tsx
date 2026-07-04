import { ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AccessDenied() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-in fade-in zoom-in-95 duration-500">
      <div className="w-24 h-24 bg-danger/10 rounded-3xl flex items-center justify-center text-danger mb-8 shadow-[0_0_40px_rgba(239,68,68,0.2)]">
        <ShieldAlert size={48} strokeWidth={1.5} />
      </div>
      
      <h1 className="text-3xl font-black text-primary tracking-tight mb-3">Access Denied</h1>
      <p className="text-secondary max-w-md text-base mb-8 leading-relaxed">
        You do not have the required role permissions to view this page. If you believe this is an error, please contact the System Administrator.
      </p>
      
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.back()} 
          className="btn btn-secondary shadow-sm hover:scale-105 transition-all"
        >
          <ArrowLeft size={16} /> Go Back
        </button>
        <Link 
          href="/dashboard" 
          className="btn btn-primary shadow-[0_4px_14px_rgba(234,179,8,0.3)] hover:scale-105 transition-all"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
