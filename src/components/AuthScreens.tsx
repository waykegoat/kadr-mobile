import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, X, ShieldAlert, CheckCircle2, Sparkles } from 'lucide-react';
import type { StoredAccount, UserProfile } from '../data/mockData';
import {
  validateEmail,
  validatePhone,
  validateEmailOrPhone,
  formatPhoneInput,
  validateName,
  validatePassword,
  validateConfirmPassword,
} from '../utils/validation';

interface AuthScreensProps {
  initialScreen?: 'login' | 'register' | 'forgot';
  accounts: StoredAccount[];
  onRegisterAccount: (account: StoredAccount) => void;
  onUpdatePassword: (identifier: string, newPassword: string) => void;
  onSuccess: (user: UserProfile) => void;
  onBack: () => void;
}

export const AuthScreens: React.FC<AuthScreensProps> = ({
  initialScreen = 'login',
  accounts,
  onRegisterAccount,
  onUpdatePassword,
  onSuccess,
  onBack,
}) => {
  const [screen, setScreen] = useState<'login' | 'register' | 'forgot' | 'code' | 'reset'>(initialScreen);

  // Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('ivan@example.com');
  const [phone, setPhone] = useState('+7 (900) 123-45-67');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Validation error states per field & banner
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [toastError, setToastError] = useState<string | null>(null);
  const [toastSuccess, setToastSuccess] = useState<string | null>(null);

  // OTP Code verification state
  const [otp, setOtp] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(45);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (screen === 'code' && timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [screen, timer]);

  const switchScreen = (next: 'login' | 'register' | 'forgot' | 'code' | 'reset') => {
    setErrors({});
    setToastError(null);
    setToastSuccess(null);
    setScreen(next);
  };

  const findAccount = (identifier: string) => {
    const clean = identifier.trim().toLowerCase();
    const cleanDigits = identifier.replace(/\D/g, '');
    return accounts.find((acc) => {
      if (acc.email.toLowerCase() === clean) return true;
      if (cleanDigits.length >= 10 && acc.phone && acc.phone.replace(/\D/g, '') === cleanDigits) {
        return true;
      }
      return false;
    });
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const idErr = validateEmailOrPhone(email);
    const passErr = !password ? 'Введите пароль' : password.length < 6 ? 'Минимум 6 символов' : null;

    if (idErr || passErr) {
      setErrors({ email: idErr, password: passErr });
      setToastError('Проверьте правильность заполнения полей');
      return;
    }

    const found = findAccount(email);
    if (!found) {
      setErrors({ email: 'Аккаунт не найден' });
      setToastError('Пользователь с таким email или телефоном не зарегистрирован');
      return;
    }

    if (found.password !== password) {
      setErrors({ password: 'Неверный пароль' });
      setToastError('Неправильный логин или пароль');
      return;
    }

    setErrors({});
    setToastError(null);
    onSuccess({
      name: found.name,
      email: found.email,
      phone: found.phone,
      bonuses: found.bonuses ?? 420,
      notificationsEnabled: found.notificationsEnabled ?? true,
    });
  };

  const handleDemoLogin = () => {
    const demo = accounts[0] || {
      name: 'Иван Петров',
      email: 'ivan@example.com',
      phone: '+7 (900) 123-45-67',
      password: 'password123',
      bonuses: 420,
      notificationsEnabled: true,
    };
    setEmail(demo.email);
    setPassword(demo.password);
    setErrors({});
    setToastError(null);
    onSuccess({
      name: demo.name,
      email: demo.email,
      phone: demo.phone,
      bonuses: demo.bonuses ?? 420,
      notificationsEnabled: demo.notificationsEnabled ?? true,
    });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const nameErr = validateName(name, 'Имя и фамилия');
    const emailErr = validateEmail(email);
    const phoneErr = validatePhone(phone);
    const passErr = validatePassword(password, true);
    const confErr = validateConfirmPassword(password, confirmPassword);

    if (nameErr || emailErr || phoneErr || passErr || confErr) {
      setErrors({
        name: nameErr,
        email: emailErr,
        phone: phoneErr,
        password: passErr,
        confirmPassword: confErr,
      });
      setToastError('Исправьте ошибки в форме регистрации');
      return;
    }

    if (findAccount(email)) {
      setErrors({ email: 'Этот email уже зарегистрирован' });
      setToastError('Аккаунт с таким email уже существует');
      return;
    }

    const newAcc: StoredAccount = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      password,
      bonuses: 100,
      notificationsEnabled: true,
    };

    onRegisterAccount(newAcc);
    onSuccess({
      name: newAcc.name,
      email: newAcc.email,
      phone: newAcc.phone,
      bonuses: newAcc.bonuses,
      notificationsEnabled: newAcc.notificationsEnabled,
    });
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const idErr = validateEmailOrPhone(email);
    if (idErr) {
      setErrors({ email: idErr });
      return;
    }
    const found = findAccount(email);
    if (!found) {
      setErrors({ email: 'Пользователь с такими данными не найден' });
      return;
    }
    setErrors({});
    setToastSuccess('Код подтверждения отправлен (для демо введите любые 4 цифры)');
    setTimer(45);
    setTimeout(() => {
      setToastSuccess(null);
      setScreen('code');
    }, 1000);
  };

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 4 || !/^\d{4}$/.test(code)) {
      setErrors({ otp: 'Введите все 4 цифры кода подтверждения' });
      return;
    }
    setErrors({});
    setPassword('');
    setConfirmPassword('');
    setScreen('reset');
  };

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const passErr = validatePassword(password, true);
    const confErr = validateConfirmPassword(password, confirmPassword);
    if (passErr || confErr) {
      setErrors({ password: passErr, confirmPassword: confErr });
      return;
    }
    onUpdatePassword(email, password);
    setErrors({});
    setToastSuccess('Пароль успешно изменён и сохранён!');
    setTimeout(() => {
      setToastSuccess(null);
      setScreen('login');
    }, 1200);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#FAF9F5] text-[#1A1A1A] p-6 overflow-y-auto animate-fade-in relative">
      {/* Top back navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => {
            if (screen === 'reset') switchScreen('code');
            else if (screen === 'code') switchScreen('forgot');
            else if (screen === 'forgot' || screen === 'register') switchScreen('login');
            else onBack();
          }}
          className="flex items-center gap-1.5 text-sm font-bold text-[#005C53] hover:text-[#046C62] transition-colors cursor-pointer"
        >
          <ArrowLeft size={18} />
          <span>Назад</span>
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => switchScreen('login')}
            className={`text-[10px] font-bold px-2.5 py-1 rounded-lg cursor-pointer ${
              screen === 'login' ? 'bg-[#005C53] text-white' : 'bg-white border border-[#EAE7DF] text-[#7A7A7A]'
            }`}
          >
            Вход
          </button>
          <button
            type="button"
            onClick={() => switchScreen('register')}
            className={`text-[10px] font-bold px-2.5 py-1 rounded-lg cursor-pointer ${
              screen === 'register' ? 'bg-[#005C53] text-white' : 'bg-white border border-[#EAE7DF] text-[#7A7A7A]'
            }`}
          >
            Рег.
          </button>
        </div>
      </div>

      {/* Screen 03: LOGIN SCREEN */}
      {screen === 'login' && (
        <div className="flex-1 flex flex-col animate-slide-up">
          <div className="mb-5">
            <h1 className="text-3xl font-black tracking-tight text-[#1A1A1A]">Вход</h1>
            <p className="text-sm text-[#7A7A7A] mt-1">Войдите в свой аккаунт КАДР</p>
          </div>

          {toastError && (
            <div className="mb-4 bg-red-50 text-red-800 text-xs p-3 rounded-2xl border border-red-200 flex items-center justify-between gap-2 animate-fade-in">
              <div className="flex items-center gap-2 font-medium leading-snug">
                <ShieldAlert size={16} className="text-red-500 shrink-0" />
                <span>{toastError}</span>
              </div>
              <button
                type="button"
                onClick={() => setToastError(null)}
                className="text-red-400 hover:text-red-600 shrink-0 cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Demo instant login button */}
          <button
            type="button"
            onClick={handleDemoLogin}
            className="mb-4 p-3 rounded-2xl bg-[#EBF3F2] border border-[#005C53]/30 hover:border-[#005C53] flex items-center justify-between text-left transition-all cursor-pointer shadow-2xs"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#005C53] text-white flex items-center justify-center shrink-0">
                <Sparkles size={15} />
              </div>
              <div>
                <div className="text-xs font-bold text-[#1A1A1A]">Быстрый демо-вход</div>
                <div className="text-[10px] text-[#7A7A7A] font-mono">ivan@example.com / password123</div>
              </div>
            </div>
            <span className="text-xs font-bold text-[#005C53]">Войти →</span>
          </button>

          <form onSubmit={handleLogin} noValidate className="space-y-3.5">
            <div>
              <label className="text-xs font-bold text-[#7A7A7A] mb-1.5 block">
                Email или телефон *
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: null });
                  if (toastError) setToastError(null);
                }}
                placeholder="ivan@example.com"
                className={`w-full px-4 py-3.5 bg-white border focus:outline-none rounded-2xl text-sm text-[#1A1A1A] placeholder-[#9A9890] transition-colors shadow-2xs ${
                  errors.email ? 'border-red-500' : 'border-[#EAE7DF] focus:border-[#005C53]'
                }`}
              />
              {errors.email && <p className="text-[11px] text-red-600 mt-1 font-medium">{errors.email}</p>}
            </div>

            <div>
              <label className="text-xs font-bold text-[#7A7A7A] mb-1.5 block">
                Пароль *
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors({ ...errors, password: null });
                  if (toastError) setToastError(null);
                }}
                placeholder="Минимум 6 символов"
                className={`w-full px-4 py-3.5 bg-white border focus:outline-none rounded-2xl text-sm text-[#1A1A1A] placeholder-[#9A9890] transition-colors shadow-2xs ${
                  errors.password ? 'border-red-500' : 'border-[#EAE7DF] focus:border-[#005C53]'
                }`}
              />
              {errors.password && <p className="text-[11px] text-red-600 mt-1 font-medium">{errors.password}</p>}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-[#005C53] hover:bg-[#046C62] active:scale-98 text-white font-bold rounded-2xl text-sm transition-all shadow-sm cursor-pointer mt-2"
            >
              Войти
            </button>
          </form>

          {/* Forgot Password link */}
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => switchScreen('forgot')}
              className="text-xs font-bold text-[#005C53] hover:underline cursor-pointer"
            >
              Забыли пароль?
            </button>
          </div>

          {/* Social login buttons */}
          <div className="mt-6">
            <div className="relative text-center mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#EAE7DF]" />
              </div>
              <span className="relative bg-[#FAF9F5] px-3 text-xs text-[#7A7A7A]">
                или войдите через
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  onSuccess({
                    name: 'Иван Петров (TG)',
                    email: 'telegram@kadr.ru',
                    phone: '+7 (900) 555-35-35',
                    bonuses: 250,
                  })
                }
                className="py-3 bg-white border border-[#EAE7DF] hover:border-[#005C53] rounded-2xl text-xs font-bold text-[#1A1A1A] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
              >
                <span>Telegram</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  onSuccess({
                    name: 'Иван Петров (VK)',
                    email: 'vk@kadr.ru',
                    phone: '+7 (900) 777-11-22',
                    bonuses: 250,
                  })
                }
                className="py-3 bg-white border border-[#EAE7DF] hover:border-[#005C53] rounded-2xl text-xs font-bold text-[#1A1A1A] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
              >
                <span>VK</span>
              </button>
            </div>
          </div>

          <div className="mt-auto pt-6 text-center">
            <button
              type="button"
              onClick={() => switchScreen('register')}
              className="w-full py-3 bg-white border border-[#EAE7DF] hover:border-[#005C53] text-[#1A1A1A] font-bold rounded-2xl text-xs transition-colors cursor-pointer shadow-2xs"
            >
              Создать аккаунт
            </button>
          </div>
        </div>
      )}

      {/* Screen 04: REGISTER SCREEN */}
      {screen === 'register' && (
        <div className="flex-1 flex flex-col animate-slide-up">
          <div className="mb-4">
            <h1 className="text-3xl font-black tracking-tight text-[#1A1A1A]">Регистрация</h1>
            <p className="text-sm text-[#7A7A7A] mt-1">Создайте личный аккаунт (+100 бонусов)</p>
          </div>

          {toastError && (
            <div className="mb-3 bg-red-50 text-red-800 text-xs p-3 rounded-2xl border border-red-200 flex items-center gap-2">
              <ShieldAlert size={16} className="text-red-500 shrink-0" />
              <span>{toastError}</span>
            </div>
          )}

          <form onSubmit={handleRegister} noValidate className="space-y-3">
            <div>
              <label className="text-xs font-bold text-[#7A7A7A] mb-1 block">Имя и фамилия *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors({ ...errors, name: null });
                }}
                placeholder="Иван Петров"
                className={`w-full px-4 py-3 bg-white border focus:outline-none rounded-2xl text-sm text-[#1A1A1A] shadow-2xs ${
                  errors.name ? 'border-red-500' : 'border-[#EAE7DF] focus:border-[#005C53]'
                }`}
              />
              {errors.name && <p className="text-[11px] text-red-600 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="text-xs font-bold text-[#7A7A7A] mb-1 block">Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: null });
                }}
                placeholder="ivan@example.com"
                className={`w-full px-4 py-3 bg-white border focus:outline-none rounded-2xl text-sm text-[#1A1A1A] shadow-2xs ${
                  errors.email ? 'border-red-500' : 'border-[#EAE7DF] focus:border-[#005C53]'
                }`}
              />
              {errors.email && <p className="text-[11px] text-red-600 mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="text-xs font-bold text-[#7A7A7A] mb-1 block">Телефон *</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(formatPhoneInput(e.target.value));
                  if (errors.phone) setErrors({ ...errors, phone: null });
                }}
                placeholder="+7 (900) 123-45-67"
                className={`w-full px-4 py-3 bg-white border focus:outline-none rounded-2xl text-sm text-[#1A1A1A] shadow-2xs ${
                  errors.phone ? 'border-red-500' : 'border-[#EAE7DF] focus:border-[#005C53]'
                }`}
              />
              {errors.phone && <p className="text-[11px] text-red-600 mt-1">{errors.phone}</p>}
            </div>

            <div>
              <label className="text-xs font-bold text-[#7A7A7A] mb-1 block">Пароль *</label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors({ ...errors, password: null });
                }}
                placeholder="Мин. 6 символов, буквы и цифры"
                className={`w-full px-4 py-3 bg-white border focus:outline-none rounded-2xl text-sm text-[#1A1A1A] shadow-2xs ${
                  errors.password ? 'border-red-500' : 'border-[#EAE7DF] focus:border-[#005C53]'
                }`}
              />
              {errors.password && <p className="text-[11px] text-red-600 mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="text-xs font-bold text-[#7A7A7A] mb-1 block">Повторите пароль *</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: null });
                }}
                placeholder="Повторите пароль"
                className={`w-full px-4 py-3 bg-white border focus:outline-none rounded-2xl text-sm text-[#1A1A1A] shadow-2xs ${
                  errors.confirmPassword ? 'border-red-500' : 'border-[#EAE7DF] focus:border-[#005C53]'
                }`}
              />
              {errors.confirmPassword && (
                <p className="text-[11px] text-red-600 mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-[#005C53] hover:bg-[#046C62] active:scale-98 text-white font-bold rounded-2xl text-sm transition-all shadow-sm cursor-pointer mt-2"
            >
              Зарегистрироваться
            </button>
          </form>

          <div className="mt-auto pt-4 text-center">
            <button
              type="button"
              onClick={() => switchScreen('login')}
              className="text-xs text-[#7A7A7A] hover:text-[#005C53] cursor-pointer"
            >
              Уже есть аккаунт? <strong className="text-[#005C53]">Войти</strong>
            </button>
          </div>
        </div>
      )}

      {/* Screen 05: FORGOT PASSWORD */}
      {screen === 'forgot' && (
        <div className="flex-1 flex flex-col animate-slide-up">
          <div className="mb-6">
            <h1 className="text-3xl font-black tracking-tight text-[#1A1A1A]">Забыли пароль?</h1>
            <p className="text-sm text-[#7A7A7A] mt-1">
              Введите email или телефон — отправим код для восстановления доступа
            </p>
          </div>

          {toastSuccess && (
            <div className="mb-4 bg-[#EBF3F2] border border-[#005C53]/30 text-[#005C53] text-xs p-4 rounded-2xl shadow-2xs">
              <div className="font-bold mb-1">Восстановление пароля</div>
              <p>{toastSuccess}</p>
            </div>
          )}

          <form onSubmit={handleForgotSubmit} noValidate className="space-y-4">
            <div>
              <label className="text-xs font-bold text-[#7A7A7A] mb-1.5 block">
                Email или телефон *
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: null });
                }}
                placeholder="ivan@example.com"
                className={`w-full px-4 py-3.5 bg-white border focus:outline-none rounded-2xl text-sm text-[#1A1A1A] shadow-2xs ${
                  errors.email ? 'border-red-500' : 'border-[#EAE7DF] focus:border-[#005C53]'
                }`}
              />
              {errors.email && <p className="text-[11px] text-red-600 mt-1">{errors.email}</p>}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-[#005C53] hover:bg-[#046C62] active:scale-98 text-white font-bold rounded-2xl text-sm transition-all shadow-sm cursor-pointer"
            >
              Отправить код
            </button>
          </form>
        </div>
      )}

      {/* Screen 06: OTP CODE */}
      {screen === 'code' && (
        <div className="flex-1 flex flex-col animate-slide-up">
          <div className="mb-6">
            <h1 className="text-3xl font-black tracking-tight text-[#1A1A1A]">Код подтверждения</h1>
            <p className="text-sm text-[#7A7A7A] mt-1">
              Мы отправили 4-значный код на <strong>{email}</strong>
            </p>
          </div>

          <form onSubmit={handleCodeSubmit} noValidate className="space-y-6">
            <div>
              <div className="flex justify-center gap-3">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      otpRefs.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(-1);
                      const nextOtp = [...otp];
                      nextOtp[idx] = val;
                      setOtp(nextOtp);
                      if (errors.otp) setErrors({ ...errors, otp: null });
                      if (val && idx < 3) {
                        otpRefs.current[idx + 1]?.focus();
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
                        otpRefs.current[idx - 1]?.focus();
                      }
                    }}
                    className={`w-14 h-16 text-center text-2xl font-black bg-white border focus:outline-none rounded-2xl text-[#1A1A1A] shadow-2xs ${
                      errors.otp ? 'border-red-500' : 'border-[#EAE7DF] focus:border-[#005C53]'
                    }`}
                  />
                ))}
              </div>
              {errors.otp && <p className="text-[11px] text-red-600 text-center mt-2">{errors.otp}</p>}
            </div>

            <div className="text-center text-xs text-[#7A7A7A]">
              {timer > 0 ? (
                <span>
                  Повторный код через{' '}
                  <span className="font-mono font-bold text-[#005C53]">
                    0:{timer.toString().padStart(2, '0')}
                  </span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setTimer(45)}
                  className="text-[#005C53] font-bold hover:underline cursor-pointer"
                >
                  Отправить код повторно
                </button>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-[#005C53] hover:bg-[#046C62] active:scale-98 text-white font-bold rounded-2xl text-sm transition-all shadow-sm cursor-pointer"
            >
              Подтвердить
            </button>
          </form>
        </div>
      )}

      {/* Screen 07: RESET PASSWORD */}
      {screen === 'reset' && (
        <div className="flex-1 flex flex-col animate-slide-up">
          <div className="mb-6">
            <h1 className="text-3xl font-black tracking-tight text-[#1A1A1A]">Новый пароль</h1>
            <p className="text-sm text-[#7A7A7A] mt-1">Придумайте новый надёжный пароль</p>
          </div>

          {toastSuccess && (
            <div className="mb-4 bg-[#EBF3F2] border border-[#005C53]/30 text-[#005C53] text-xs p-4 rounded-2xl flex items-center gap-2">
              <CheckCircle2 size={18} className="shrink-0" />
              <span className="font-bold">{toastSuccess}</span>
            </div>
          )}

          <form onSubmit={handleResetSubmit} noValidate className="space-y-4">
            <div>
              <label className="text-xs font-bold text-[#7A7A7A] mb-1.5 block">Новый пароль *</label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors({ ...errors, password: null });
                }}
                placeholder="Мин. 6 символов, буквы и цифры"
                className={`w-full px-4 py-3.5 bg-white border focus:outline-none rounded-2xl text-sm text-[#1A1A1A] shadow-2xs ${
                  errors.password ? 'border-red-500' : 'border-[#EAE7DF] focus:border-[#005C53]'
                }`}
              />
              {errors.password && <p className="text-[11px] text-red-600 mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="text-xs font-bold text-[#7A7A7A] mb-1.5 block">Повторите пароль *</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: null });
                }}
                placeholder="Повторите пароль"
                className={`w-full px-4 py-3.5 bg-white border focus:outline-none rounded-2xl text-sm text-[#1A1A1A] shadow-2xs ${
                  errors.confirmPassword ? 'border-red-500' : 'border-[#EAE7DF] focus:border-[#005C53]'
                }`}
              />
              {errors.confirmPassword && (
                <p className="text-[11px] text-red-600 mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-[#005C53] hover:bg-[#046C62] active:scale-98 text-white font-bold rounded-2xl text-sm transition-all shadow-sm cursor-pointer"
            >
              Сохранить пароль
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
