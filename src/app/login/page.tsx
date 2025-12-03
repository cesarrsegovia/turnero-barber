'use client';

import { useActionState } from 'react';
import { login, logout } from '@/actions/auth';

const initialState = {
    message: '',
};

export default function LoginPage() {
    // Conectamos el formulario con la Server Action 'login'
    const [state, formAction, isPending] = useActionState(login, initialState);

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-barber-gray p-8 rounded-2xl border border-white/10 shadow-2xl">

                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Barber Admin</h1>
                    <p className="text-gray-400">Ingresa tus credenciales</p>
                    <button onClick={() => logout()} className="text-sm text-red-400 hover:text-red-300 underline">
                        Cerrar Sesión
                    </button>
                </div>

                <form action={formAction} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Usuario</label>
                        <input
                            name="username"
                            type="text"
                            required
                            className="w-full bg-black/50 border border-gray-600 rounded-lg p-3 text-white focus:border-barber-orange focus:outline-none transition-colors"
                            placeholder="admin"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Contraseña</label>
                        <input
                            name="password"
                            type="password"
                            required
                            className="w-full bg-black/50 border border-gray-600 rounded-lg p-3 text-white focus:border-barber-orange focus:outline-none transition-colors"
                            placeholder="••••••••"
                        />
                    </div>

                    {state?.message && (
                        <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-200 text-sm text-center">
                            {state.message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                        {isPending ? 'Ingresando...' : 'Entrar al Dashboard'}
                    </button>
                </form>
            </div>
        </div>
    );
}