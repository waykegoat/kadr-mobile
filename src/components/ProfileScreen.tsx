import React, { useState, useEffect } from 'react';
import {
  User,
  Ticket as TicketIcon,
  CreditCard,
  LogOut,
  ChevronRight,
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
  Shield,
  Settings,
  Award,
  X,
  Bell,
} from 'lucide-react';
import type { UserProfile, SavedCard } from '../data/mockData';
import {
  validateName,
  validateEmail,
  validatePhone,
  formatPhoneInput,
  formatCardNumber,
  detectCardBrand,
  validateCardNumber,
  formatCardExpiry,
  validateCardExpiry,
  validateCardCvv,
} from '../utils/validation';

interface ProfileScreenProps {
  user: UserProfile | null;
  savedCards: SavedCard[];
  onAddCard: (card: SavedCard) => void;
  onDeleteCard: (id: string) => void;
  onUpdateUser: (updated: UserProfile) => void;
  onOpenLogin: () => void;
  onLogout: () => void;
  onNavigateTickets: () => void;
  onOpenAdmin: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  user,
  savedCards,
  onAddCard,
  onDeleteCard,
  onUpdateUser,
  onOpenLogin,
  onLogout,
  onNavigateTickets,
  onOpenAdmin,
}) => {
  const [subView, setSubView] = useState<'main' | 'payment_methods' | 'settings'>('main');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showAddCardModal, setShowAddCardModal] = useState(false);

  // Settings form state
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '+7 (900) 123-45-67');
  const [editNotify, setEditNotify] = useState(user?.notificationsEnabled ?? true);
  const [profileErrors, setProfileErrors] = useState<Record<string, string | null>>({});
  const [profileSavedToast, setProfileSavedToast] = useState(false);

  // Add card form state
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardErrors, setCardErrors] = useState<Record<string, string | null>>({});

  useEffect(() => {
    if (user) {
      setEditName(user.name);
      setEditEmail(user.email);
      setEditPhone(user.phone || '+7 (900) 123-45-67');
      setEditNotify(user.notificationsEnabled ?? true);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#FAF9F5] text-[#1A1A1A] text-center">
        <div className="w-20 h-20 rounded-full bg-white border border-[#EAE7DF] flex items-center justify-center mb-4 text-[#005C53] shadow-xs">
          <User size={36} />
        </div>
        <h2 className="text-xl font-black mb-2">Вход в профиль</h2>
        <p className="text-xs text-[#7A7A7A] mb-4 max-w-xs">
          Войдите, чтобы просматривать купленные билеты, сохранять способы оплаты и пользоваться бонусами.
        </p>

        <div className="w-full max-w-[280px] mb-5 p-3 rounded-2xl bg-white border border-[#EAE7DF] shadow-xs text-left flex items-start gap-2.5">
          <Award size={18} className="text-[#005C53] shrink-0 mt-0.5" />
          <div>
            <p className="text-[11px] font-bold text-[#1A1A1A]">Бонусы КАДР (1 Б = 1 ₽)</p>
            <p className="text-[10px] text-[#7A7A7A] leading-relaxed mt-0.5">
              Кэшбэк +5% и оплата бонусами до 50% заказа доступны только авторизованным пользователям.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenLogin}
          className="w-full max-w-[260px] py-3.5 bg-[#005C53] hover:bg-[#046C62] active:scale-98 text-white font-bold rounded-2xl text-sm transition-all shadow-sm cursor-pointer"
        >
          Войти или зарегистрироваться
        </button>

        <button
          onClick={onOpenAdmin}
          className="mt-6 text-xs text-[#7A7A7A] hover:text-[#005C53] flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Shield size={14} />
          <span>Вход для администратора</span>
        </button>
      </div>
    );
  }

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const nameErr = validateName(editName, 'Имя');
    const emailErr = validateEmail(editEmail);
    const phoneErr = validatePhone(editPhone);

    if (nameErr || emailErr || phoneErr) {
      setProfileErrors({ name: nameErr, email: emailErr, phone: phoneErr });
      return;
    }

    setProfileErrors({});
    onUpdateUser({
      ...user,
      name: editName.trim(),
      email: editEmail.trim().toLowerCase(),
      phone: editPhone.trim(),
      notificationsEnabled: editNotify,
    });
    setProfileSavedToast(true);
    setTimeout(() => setProfileSavedToast(false), 2500);
  };

  const handleCreateCard = (e: React.FormEvent) => {
    e.preventDefault();
    const numErr = validateCardNumber(cardNumber);
    const expErr = validateCardExpiry(cardExpiry);
    const cvvErr = validateCardCvv(cardCvv);

    if (numErr || expErr || cvvErr) {
      setCardErrors({ number: numErr, expiry: expErr, cvv: cvvErr });
      return;
    }

    const digits = cardNumber.replace(/\D/g, '');
    const last4 = digits.slice(-4);
    const brand = detectCardBrand(digits);

    onAddCard({
      id: `card-${Date.now()}`,
      label: brand,
      number: `•••• ${last4}`,
      last4,
      expiry: cardExpiry.trim(),
    });

    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
    setCardErrors({});
    setShowAddCardModal(false);
  };

  // Payment Methods sub-view
  if (subView === 'payment_methods') {
    return (
      <div className="flex-1 flex flex-col bg-[#FAF9F5] text-[#1A1A1A] p-5 animate-slide-up relative overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-[#EAE7DF] mb-5">
          <button
            type="button"
            onClick={() => setSubView('main')}
            className="flex items-center gap-1.5 text-xs font-bold text-[#005C53] hover:text-[#046C62] cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Назад</span>
          </button>
          <span className="text-sm font-black">Способы оплаты</span>
          <div className="w-10" />
        </div>

        <div className="space-y-3">
          {savedCards.map((card) => (
            <div
              key={card.id}
              className="flex items-center justify-between p-4 bg-white border border-[#EAE7DF] rounded-2xl shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-7 rounded-lg bg-[#EBF3F2] border border-[#005C53]/20 flex items-center justify-center text-[#005C53]">
                  <CreditCard size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold">
                    {card.label} <span className="text-[#9A9890] font-mono text-[10px]">({card.expiry})</span>
                  </div>
                  <div className="text-[11px] text-[#7A7A7A] font-mono">{card.number}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onDeleteCard(card.id)}
                className="text-[#9A9890] hover:text-red-500 p-1 transition-colors cursor-pointer"
                title="Удалить карту"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() => {
              setCardErrors({});
              setShowAddCardModal(true);
            }}
            className="w-full flex items-center gap-3 p-4 bg-white border border-dashed border-[#C5C2B8] rounded-2xl text-xs font-medium text-[#7A7A7A] hover:text-[#1A1A1A] hover:border-[#005C53] transition-colors cursor-pointer"
          >
            <div className="w-7 h-7 rounded-full bg-[#FAF9F5] border border-[#EAE7DF] flex items-center justify-center text-[#005C53]">
              <Plus size={16} />
            </div>
            <span>Добавить карту</span>
          </button>

          <div className="flex items-center justify-between p-4 bg-white border border-[#EAE7DF] rounded-2xl shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-7 rounded-lg bg-emerald-50 border border-emerald-500/20 flex items-center justify-center text-emerald-700 font-black text-xs">
                СБП
              </div>
              <span className="text-xs font-bold">СБП подключен</span>
            </div>
            <CheckCircle2 size={18} className="text-[#005C53]" />
          </div>
        </div>

        {/* Add Card Modal strictly inside phone */}
        {showAddCardModal && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
            <div className="w-full max-w-[320px] bg-white rounded-3xl p-5 shadow-2xl border border-[#EAE7DF] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-[#1A1A1A]">Добавить карту</h3>
                <button
                  type="button"
                  onClick={() => setShowAddCardModal(false)}
                  className="text-[#7A7A7A] hover:text-[#1A1A1A] p-1 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateCard} noValidate className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#7A7A7A] mb-1">
                    Номер карты (16 цифр) *
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cardNumber}
                    onChange={(e) => {
                      setCardNumber(formatCardNumber(e.target.value));
                      if (cardErrors.number) setCardErrors({ ...cardErrors, number: null });
                    }}
                    placeholder="2200 1234 5678 9012"
                    className={`w-full bg-[#FAF9F5] border rounded-xl px-3 py-2.5 text-xs font-mono text-[#1A1A1A] focus:outline-none ${
                      cardErrors.number ? 'border-red-500' : 'border-[#EAE7DF] focus:border-[#005C53]'
                    }`}
                  />
                  {cardErrors.number && (
                    <p className="text-[10px] text-red-600 mt-1">{cardErrors.number}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#7A7A7A] mb-1">
                      Срок (ММ/ГГ) *
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={cardExpiry}
                      onChange={(e) => {
                        setCardExpiry(formatCardExpiry(e.target.value));
                        if (cardErrors.expiry) setCardErrors({ ...cardErrors, expiry: null });
                      }}
                      placeholder="12/28"
                      className={`w-full bg-[#FAF9F5] border rounded-xl px-3 py-2.5 text-xs font-mono text-[#1A1A1A] focus:outline-none ${
                        cardErrors.expiry ? 'border-red-500' : 'border-[#EAE7DF] focus:border-[#005C53]'
                      }`}
                    />
                    {cardErrors.expiry && (
                      <p className="text-[10px] text-red-600 mt-1">{cardErrors.expiry}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#7A7A7A] mb-1">
                      CVV / CVC *
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={3}
                      value={cardCvv}
                      onChange={(e) => {
                        setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 3));
                        if (cardErrors.cvv) setCardErrors({ ...cardErrors, cvv: null });
                      }}
                      placeholder="123"
                      className={`w-full bg-[#FAF9F5] border rounded-xl px-3 py-2.5 text-xs font-mono text-[#1A1A1A] focus:outline-none ${
                        cardErrors.cvv ? 'border-red-500' : 'border-[#EAE7DF] focus:border-[#005C53]'
                      }`}
                    />
                    {cardErrors.cvv && (
                      <p className="text-[10px] text-red-600 mt-1">{cardErrors.cvv}</p>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#005C53] hover:bg-[#046C62] text-white font-bold rounded-xl text-xs transition-colors cursor-pointer mt-2"
                >
                  Сохранить карту
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Account Settings sub-view matching Screen 34
  if (subView === 'settings') {
    return (
      <div className="flex-1 flex flex-col bg-[#FAF9F5] text-[#1A1A1A] p-5 overflow-y-auto animate-slide-up pb-16">
        <div className="flex items-center justify-between pb-4 border-b border-[#EAE7DF] mb-5">
          <button
            type="button"
            onClick={() => {
              setProfileErrors({});
              setSubView('main');
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-[#005C53] hover:text-[#046C62] cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Назад</span>
          </button>
          <span className="text-sm font-black">Настройки аккаунта</span>
          <div className="w-10" />
        </div>

        {profileSavedToast && (
          <div className="mb-4 p-3 bg-[#EBF3F2] border border-[#005C53]/30 rounded-2xl text-xs text-[#005C53] font-bold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>Изменения сохранены в профиль!</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} noValidate className="space-y-4">
          <div className="bg-white border border-[#EAE7DF] rounded-2xl p-4 space-y-3 shadow-2xs">
            <div>
              <label className="block text-[11px] font-bold text-[#7A7A7A] mb-1">Имя *</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => {
                  setEditName(e.target.value);
                  if (profileErrors.name) setProfileErrors({ ...profileErrors, name: null });
                }}
                placeholder="Иван Петров"
                className={`w-full bg-[#FAF9F5] border rounded-xl px-3 py-2 text-xs text-[#1A1A1A] focus:outline-none ${
                  profileErrors.name ? 'border-red-500' : 'border-[#EAE7DF] focus:border-[#005C53]'
                }`}
              />
              {profileErrors.name && (
                <p className="text-[10px] text-red-600 mt-1">{profileErrors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#7A7A7A] mb-1">Email *</label>
              <input
                type="email"
                value={editEmail}
                onChange={(e) => {
                  setEditEmail(e.target.value);
                  if (profileErrors.email) setProfileErrors({ ...profileErrors, email: null });
                }}
                placeholder="ivan@example.com"
                className={`w-full bg-[#FAF9F5] border rounded-xl px-3 py-2 text-xs text-[#1A1A1A] focus:outline-none ${
                  profileErrors.email ? 'border-red-500' : 'border-[#EAE7DF] focus:border-[#005C53]'
                }`}
              />
              {profileErrors.email && (
                <p className="text-[10px] text-red-600 mt-1">{profileErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#7A7A7A] mb-1">Телефон *</label>
              <input
                type="tel"
                value={editPhone}
                onChange={(e) => {
                  setEditPhone(formatPhoneInput(e.target.value));
                  if (profileErrors.phone) setProfileErrors({ ...profileErrors, phone: null });
                }}
                placeholder="+7 (900) 123-45-67"
                className={`w-full bg-[#FAF9F5] border rounded-xl px-3 py-2 text-xs text-[#1A1A1A] focus:outline-none ${
                  profileErrors.phone ? 'border-red-500' : 'border-[#EAE7DF] focus:border-[#005C53]'
                }`}
              />
              {profileErrors.phone && (
                <p className="text-[10px] text-red-600 mt-1">{profileErrors.phone}</p>
              )}
            </div>

            <div className="pt-2 border-t border-[#F2EFE7] flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-[#1A1A1A] font-medium">
                <Bell size={14} className="text-[#005C53]" />
                <span>Уведомления о премьерах</span>
              </div>
              <button
                type="button"
                onClick={() => setEditNotify(!editNotify)}
                className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                  editNotify ? 'bg-[#005C53]' : 'bg-[#D5D2C9]'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    editNotify ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#005C53] hover:bg-[#046C62] text-white font-bold rounded-2xl text-xs transition-colors shadow-xs cursor-pointer"
          >
            Сохранить изменения
          </button>
        </form>
      </div>
    );
  }

  // Main Profile View matching Figma Screen 33
  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-[#FAF9F5] text-[#1A1A1A] relative">
      {/* User Header Card matching Figma Screen 33 */}
      <div className="p-6 flex flex-col items-center justify-center border-b border-[#EAE7DF] bg-white">
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#0B353A] to-[#005C53] p-1 shadow-md mb-3 flex items-center justify-center">
          <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-[#005C53]">
            <User size={38} />
          </div>
        </div>
        <h2 className="text-lg font-black text-[#1A1A1A] tracking-tight">{user.name}</h2>
        <p className="text-xs text-[#7A7A7A] mt-0.5">{user.email}</p>
        {user.phone && <p className="text-[11px] text-[#9A9890] mt-0.5">{user.phone}</p>}

        {/* Loyalty bonus card */}
        <div className="mt-3 w-full max-w-[290px] px-3.5 py-2.5 rounded-2xl bg-[#EBF3F2] border border-[#005C53]/30 text-center">
          <div className="inline-flex items-center gap-1.5 text-[#005C53] text-xs font-bold">
            <Award size={14} />
            <span>{user.bonuses ?? 0} бонусов КАДР</span>
          </div>
          <p className="text-[10px] text-[#7A7A7A] mt-1">
            1 бонус = 1 ₽ · списание до 50% · +5% кэшбэк
          </p>
        </div>
      </div>

      {/* Menu Options matching Figma Screen 33 */}
      <div className="p-5 space-y-2.5 pb-16">
        <button
          onClick={onNavigateTickets}
          className="w-full flex items-center justify-between p-4 bg-white hover:border-[#005C53] rounded-2xl border border-[#EAE7DF] transition-all text-left cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#EBF3F2] text-[#005C53] flex items-center justify-center">
              <TicketIcon size={18} />
            </div>
            <span className="text-sm font-bold text-[#1A1A1A] group-hover:text-[#005C53]">Мои билеты</span>
          </div>
          <ChevronRight size={18} className="text-[#A09D94] group-hover:text-[#005C53]" />
        </button>

        <button
          onClick={() => setSubView('payment_methods')}
          className="w-full flex items-center justify-between p-4 bg-white hover:border-[#005C53] rounded-2xl border border-[#EAE7DF] transition-all text-left cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#EBF3F2] text-[#005C53] flex items-center justify-center">
              <CreditCard size={18} />
            </div>
            <div>
              <div className="text-sm font-bold text-[#1A1A1A] group-hover:text-[#005C53]">Способы оплаты</div>
              <div className="text-[10px] text-[#7A7A7A]">Карты ({savedCards.length}) и СБП</div>
            </div>
          </div>
          <ChevronRight size={18} className="text-[#A09D94] group-hover:text-[#005C53]" />
        </button>

        <button
          onClick={() => setSubView('settings')}
          className="w-full flex items-center justify-between p-4 bg-white hover:border-[#005C53] rounded-2xl border border-[#EAE7DF] transition-all text-left cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#EBF3F2] text-[#005C53] flex items-center justify-center">
              <Settings size={18} />
            </div>
            <span className="text-sm font-bold text-[#1A1A1A] group-hover:text-[#005C53]">Настройки аккаунта</span>
          </div>
          <ChevronRight size={18} className="text-[#A09D94] group-hover:text-[#005C53]" />
        </button>

        {/* Admin Panel button */}
        <button
          onClick={onOpenAdmin}
          className="w-full flex items-center justify-between p-4 bg-[#EBF3F2] hover:bg-[#E2EFEF] rounded-2xl border border-[#005C53]/30 transition-all text-left cursor-pointer shadow-2xs group mt-2"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#005C53] text-white flex items-center justify-center">
              <Shield size={18} />
            </div>
            <div>
              <div className="text-sm font-black text-[#005C53] flex items-center gap-1.5">
                <span>Панель администратора</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#005C53] text-white">КАДР</span>
              </div>
              <div className="text-[11px] text-[#7A7A7A]">Репертуар, залы, статистика</div>
            </div>
          </div>
          <ChevronRight size={18} className="text-[#005C53] group-hover:translate-x-0.5 transition-transform" />
        </button>

        <button
          onClick={() => setShowLogoutModal(true)}
          className="w-full flex items-center justify-between p-4 bg-white hover:bg-red-50 rounded-2xl border border-[#EAE7DF] hover:border-red-200 transition-colors text-left text-red-600 mt-4 cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <LogOut size={18} />
            </div>
            <span className="text-sm font-bold">Выйти из аккаунта</span>
          </div>
          <ChevronRight size={18} className="text-red-400" />
        </button>
      </div>

      {/* Screen 35 · Выйти из аккаунта? Modal */}
      {showLogoutModal && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-5 animate-fade-in">
          <div className="w-full max-w-xs bg-white rounded-3xl p-5 shadow-2xl border border-[#EAE7DF] space-y-3.5 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <LogOut size={22} />
            </div>
            <h3 className="text-base font-black text-[#1A1A1A]">Выйти из аккаунта?</h3>
            <p className="text-xs text-[#7A7A7A]">
              Вы сможете войти снова в любое время с вашим email и паролем.
            </p>
            <div className="pt-2 space-y-2">
              <button
                onClick={() => {
                  setShowLogoutModal(false);
                  onLogout();
                }}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl text-xs cursor-pointer"
              >
                Да, выйти
              </button>
              <button
                onClick={() => setShowLogoutModal(false)}
                className="w-full py-2.5 bg-white border border-[#EAE7DF] text-[#1A1A1A] font-bold rounded-2xl text-xs cursor-pointer"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
