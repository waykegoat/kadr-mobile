import React, { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard, QrCode, CheckCircle2, AlertTriangle, ShieldCheck, Tag, Award, Lock } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Movie, Ticket, UserProfile, SavedCard } from '../data/mockData';
import {
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

interface PaymentScreenProps {
  movie: Movie;
  selectedDate: string;
  selectedShowtime: {
    time: string;
    format: string;
    price: number;
    hall: string;
  };
  selectedSeats: string[];
  totalPrice: number;
  user: UserProfile | null;
  savedCards: SavedCard[];
  onAddCard: (card: SavedCard) => void;
  onOpenLogin?: () => void;
  onBack: () => void;
  onSuccess: (newTicket: Ticket) => void;
  onGoHome: () => void;
  onGoTickets: () => void;
}

export const PaymentScreen: React.FC<PaymentScreenProps> = ({
  movie,
  selectedDate,
  selectedShowtime,
  selectedSeats,
  totalPrice,
  user,
  savedCards,
  onAddCard,
  onOpenLogin,
  onBack,
  onSuccess,
  onGoHome,
  onGoTickets,
}) => {
  const [step, setStep] = useState<'cart' | 'payment' | 'processing' | 'success'>('cart');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'sbp' | 'sberpay'>('card');
  const [selectedSavedCardId, setSelectedSavedCardId] = useState<string>(savedCards[0]?.id || 'new');
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Form states
  const [email, setEmail] = useState(user?.email || 'ivan@example.com');
  const [phone, setPhone] = useState(user?.phone || '+7 (900) 123-45-67');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [saveCardToProfile, setSaveCardToProfile] = useState(true);

  // Promo code state
  const [promoCode, setPromoCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [promoFeedback, setPromoFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Bonus system state (strictly authorized users only)
  const [useBonuses, setUseBonuses] = useState(false);
  const [bonusAmountInput, setBonusAmountInput] = useState('');

  // Errors
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      setPhone(user.phone || '+7 (900) 123-45-67');
    } else {
      setUseBonuses(false);
      setBonusAmountInput('');
    }
  }, [user]);

  const priceAfterPromo = Math.max(1, Math.round(totalPrice * (1 - discountPercent / 100)));
  const userBonuses = user ? Math.max(0, user.bonuses ?? 0) : 0;
  const maxUsableBonuses = user
    ? Math.min(userBonuses, Math.floor(priceAfterPromo * 0.5), Math.max(0, priceAfterPromo - 1))
    : 0;

  const parsedBonusInput = bonusAmountInput === '' ? 0 : Math.floor(Number(bonusAmountInput));
  const bonusError =
    user && useBonuses && bonusAmountInput !== ''
      ? !Number.isFinite(parsedBonusInput) || parsedBonusInput < 0
        ? 'Введите корректное количество бонусов'
        : parsedBonusInput > userBonuses
        ? `На балансе только ${userBonuses} бонусов`
        : parsedBonusInput > maxUsableBonuses
        ? `Можно списать не более 50% заказа (макс. ${maxUsableBonuses} Б)`
        : null
      : null;

  const appliedBonuses =
    user && useBonuses && !bonusError
      ? Math.max(0, Math.min(maxUsableBonuses, parsedBonusInput))
      : 0;

  const finalPrice = Math.max(1, priceAfterPromo - appliedBonuses);
  const earnedBonuses = user ? Math.round(finalPrice * 0.05) : 0;

  const handleToggleBonuses = () => {
    if (!user) return;
    if (useBonuses) {
      setUseBonuses(false);
      setBonusAmountInput('');
      if (errors.bonuses) setErrors({ ...errors, bonuses: null });
    } else {
      setUseBonuses(true);
      setBonusAmountInput(maxUsableBonuses > 0 ? String(maxUsableBonuses) : '0');
    }
  };

  const formattedSeatsSummary = selectedSeats
    .map((s) => {
      const [r, seat] = s.split('-');
      return `Ряд ${r}, место ${seat}`;
    })
    .join('; ');

  const handleApplyPromo = () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) {
      setPromoFeedback({ type: 'err', text: 'Введите промокод (например: KINO10)' });
      return;
    }
    if (code === 'KINO10') {
      setDiscountPercent(10);
      setPromoFeedback({ type: 'ok', text: 'Промокод KINO10 применён: скидка 10%' });
    } else if (code === 'WELCOME20') {
      setDiscountPercent(20);
      setPromoFeedback({ type: 'ok', text: 'Промокод WELCOME20 применён: скидка 20%' });
    } else {
      setDiscountPercent(0);
      setPromoFeedback({ type: 'err', text: 'Промокод не найден или истёк' });
    }
  };

  const handlePay = () => {
    const nextErrs: Record<string, string | null> = {};
    const emailErr = validateEmail(email);
    const phoneErr = validatePhone(phone);
    if (emailErr) nextErrs.email = emailErr;
    if (phoneErr) nextErrs.phone = phoneErr;
    if (user && useBonuses && bonusError) nextErrs.bonuses = bonusError;

    const usingNewCard = paymentMethod === 'card' && (savedCards.length === 0 || selectedSavedCardId === 'new');
    if (usingNewCard) {
      const numErr = validateCardNumber(cardNumber);
      const expErr = validateCardExpiry(cardExpiry);
      const cvvErr = validateCardCvv(cardCvv);
      if (numErr) nextErrs.cardNumber = numErr;
      if (expErr) nextErrs.cardExpiry = expErr;
      if (cvvErr) nextErrs.cardCvv = cvvErr;
    }

    if (Object.values(nextErrs).some(Boolean)) {
      setErrors(nextErrs);
      return;
    }

    setErrors({});

    if (usingNewCard && saveCardToProfile) {
      const digits = cardNumber.replace(/\D/g, '');
      const last4 = digits.slice(-4);
      onAddCard({
        id: `card-${Date.now()}`,
        label: detectCardBrand(digits),
        number: `•••• ${last4}`,
        last4,
        expiry: cardExpiry.trim(),
      });
    }

    setStep('processing');
    setTimeout(() => {
      setStep('success');
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#005C53', '#046C62', '#EAE7DF', '#F5A623'],
        });
      } catch {
        // ignore
      }

      const newTicket: Ticket = {
        id: `ticket-${Date.now()}`,
        movieId: movie.id,
        movieTitle: movie.title,
        date: selectedDate,
        time: selectedShowtime.time,
        hall: selectedShowtime.hall,
        seats: formattedSeatsSummary,
        rawSeats: selectedSeats,
        price: finalPrice,
        qrCode: `KM-${Date.now().toString().slice(-6)}`,
        bgGradient: 'from-[#0B353A] to-[#005C53]',
        ...(appliedBonuses > 0 ? { bonusesUsed: appliedBonuses } : {}),
        ...(user && earnedBonuses > 0 ? { bonusesEarned: earnedBonuses } : {}),
      };

      onSuccess(newTicket);
    }, 1000);
  };

  const bonusSection = !user ? (
    <div className="bg-white border border-[#EAE7DF] rounded-2xl p-4 shadow-xs space-y-2.5">
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-[#F2EFE7] text-[#7A7A7A] flex items-center justify-center shrink-0">
          <Lock size={15} />
        </div>
        <div className="flex-1">
          <div className="text-xs font-black text-[#1A1A1A]">Бонусы КАДР (только для авторизованных)</div>
          <p className="text-[11px] text-[#7A7A7A] leading-relaxed mt-0.5">
            Списание баллов (до 50% заказа) и начисление +5% кэшбэка доступны только после входа в аккаунт.
          </p>
        </div>
      </div>
      {onOpenLogin && (
        <button
          type="button"
          onClick={onOpenLogin}
          className="w-full py-2.5 rounded-xl bg-[#EBF3F2] hover:bg-[#dcebe9] border border-[#005C53]/30 text-[#005C53] text-xs font-bold transition-colors cursor-pointer"
        >
          Войти для использования бонусов
        </button>
      )}
    </div>
  ) : (
    <div className="bg-white border border-[#005C53]/25 rounded-2xl p-4 shadow-xs space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#EBF3F2] text-[#005C53] flex items-center justify-center shrink-0">
            <Award size={16} />
          </div>
          <div>
            <div className="text-xs font-black text-[#1A1A1A]">Бонусы КАДР</div>
            <div className="text-[10px] text-[#7A7A7A]">
              Доступно: <strong className="text-[#005C53]">{userBonuses} Б</strong> (1 Б = 1 ₽)
            </div>
          </div>
        </div>

        <button
          type="button"
          disabled={maxUsableBonuses === 0}
          onClick={handleToggleBonuses}
          className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
            useBonuses
              ? 'bg-[#005C53] text-white shadow-xs'
              : 'bg-[#EBF3F2] text-[#005C53] border border-[#005C53]/25'
          }`}
        >
          {useBonuses ? 'Списываем' : 'Списать'}
        </button>
      </div>

      {useBonuses && maxUsableBonuses > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-[#F2EFE7]">
          <div className="flex items-center justify-between text-[10px] text-[#7A7A7A]">
            <span>Сколько списать (до {maxUsableBonuses} Б):</span>
            <button
              type="button"
              onClick={() => {
                setBonusAmountInput(String(maxUsableBonuses));
                if (errors.bonuses) setErrors({ ...errors, bonuses: null });
              }}
              className="text-[#005C53] font-bold hover:underline cursor-pointer"
            >
              Максимум
            </button>
          </div>
          <input
            type="number"
            min={0}
            max={maxUsableBonuses}
            value={bonusAmountInput}
            onChange={(e) => {
              setBonusAmountInput(e.target.value.replace(/[^\d]/g, ''));
              if (errors.bonuses) setErrors({ ...errors, bonuses: null });
            }}
            placeholder={`0 – ${maxUsableBonuses}`}
            className={`w-full bg-[#FAF9F5] border rounded-xl px-3 py-2 text-xs font-bold text-[#1A1A1A] focus:outline-none ${
              bonusError || errors.bonuses ? 'border-red-500' : 'border-[#EAE7DF] focus:border-[#005C53]'
            }`}
          />
          {(bonusError || errors.bonuses) && (
            <p className="text-[10px] text-red-600">{bonusError || errors.bonuses}</p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#F2EFE7]">
        <span className="text-[#7A7A7A]">Кэшбэк за этот заказ (5%):</span>
        <span className="font-bold text-[#005C53]">+{earnedBonuses} Б</span>
      </div>
    </div>
  );

  // Screen 23 · Покупка завершена
  if (step === 'success') {
    return (
      <div className="flex-1 flex flex-col bg-[#FAF9F5] text-[#1A1A1A] p-6 animate-fade-in justify-between">
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-20 h-20 rounded-full bg-[#EBF3F2] border border-[#005C53]/30 flex items-center justify-center text-[#005C53] mb-2 shadow-sm">
            <CheckCircle2 size={44} strokeWidth={2.5} />
          </div>

          <span className="text-[10px] font-black tracking-widest text-[#005C53] uppercase">
            Заказ #KM-{Date.now().toString().slice(-5)}
          </span>
          <h2 className="text-2xl font-black text-[#1A1A1A]">Покупка завершена!</h2>
          <p className="text-xs text-[#7A7A7A] max-w-xs">
            Электронные билеты ({finalPrice} ₽) отправлены на почту <strong className="text-[#1A1A1A]">{email.trim()}</strong>.
          </p>

          <div className="w-full max-w-xs p-4 bg-white border border-[#EAE7DF] rounded-2xl shadow-xs text-left space-y-2 mt-4">
            <div className="text-sm font-black text-[#1A1A1A]">{movie.title}</div>
            <div className="text-xs text-[#7A7A7A]">
              {selectedDate} · {selectedShowtime.time} · {selectedShowtime.hall}
            </div>
            <div className="text-xs text-[#1A1A1A] font-bold pt-1 border-t border-[#F2EFE7]">
              {formattedSeatsSummary}
            </div>
            {(appliedBonuses > 0 || (user && earnedBonuses > 0)) && (
              <div className="pt-2 border-t border-[#F2EFE7] space-y-1 text-[11px]">
                {appliedBonuses > 0 && (
                  <div className="flex items-center justify-between text-[#7A7A7A]">
                    <span>Списано бонусов:</span>
                    <span className="font-bold text-[#1A1A1A]">−{appliedBonuses} Б</span>
                  </div>
                )}
                {user && earnedBonuses > 0 && (
                  <div className="flex items-center justify-between text-[#005C53]">
                    <span>Начислено кэшбэком:</span>
                    <span className="font-bold">+{earnedBonuses} Б</span>
                  </div>
                )}
              </div>
            )}
            {!user && (
              <div className="pt-2 border-t border-[#F2EFE7] text-[10px] text-[#7A7A7A]">
                Бонусы не начислены: программа лояльности работает только для авторизованных пользователей.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2.5">
          <button
            onClick={onGoTickets}
            className="w-full py-3.5 bg-[#005C53] hover:bg-[#046C62] text-white font-bold rounded-2xl text-xs transition-colors shadow-sm cursor-pointer"
          >
            Перейти к билетам
          </button>
          <button
            onClick={onGoHome}
            className="w-full py-3 bg-white border border-[#EAE7DF] hover:border-[#005C53] text-[#1A1A1A] font-bold rounded-2xl text-xs transition-colors cursor-pointer"
          >
            На главную
          </button>
        </div>
      </div>
    );
  }

  // Screen 22 · Обработка платежа
  if (step === 'processing') {
    return (
      <div className="flex-1 flex flex-col bg-[#FAF9F5] text-[#1A1A1A] p-6 items-center justify-center text-center space-y-4">
        <div className="w-16 h-16 rounded-full border-4 border-[#005C53] border-t-transparent animate-spin" />
        <h3 className="text-lg font-black text-[#1A1A1A]">Обработка платежа</h3>
        <p className="text-xs text-[#7A7A7A] max-w-xs">
          Связываемся с банком для подтверждения оплаты заказа на сумму {finalPrice} ₽...
        </p>
      </div>
    );
  }

  // Screen 17 · Корзина
  if (step === 'cart') {
    return (
      <div className="flex-1 flex flex-col bg-[#FAF9F5] text-[#1A1A1A] overflow-hidden animate-fade-in relative">
        <div className="p-4 border-b border-[#EAE7DF] bg-white flex items-center justify-between shrink-0">
          <button
            onClick={() => setShowCancelModal(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-[#005C53] hover:text-[#046C62] cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Назад</span>
          </button>
          <span className="text-base font-black text-[#1A1A1A]">Корзина</span>
          <div className="w-10" />
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 pb-24">
          <div className="bg-white border border-[#EAE7DF] rounded-2xl p-4 shadow-xs space-y-3">
            <div className="pb-3 border-b border-[#F2EFE7]">
              <h2 className="text-base font-black text-[#1A1A1A]">{movie.title}</h2>
              <div className="text-xs text-[#7A7A7A] mt-0.5">
                {selectedDate} · {selectedShowtime.time} · {selectedShowtime.hall}
              </div>
            </div>

            <div className="space-y-2">
              {selectedSeats.map((s, idx) => {
                const [r, num] = s.split('-');
                return (
                  <div key={idx} className="flex items-center justify-between text-xs py-1">
                    <span className="font-medium text-[#1A1A1A]">
                      Ряд {r}, место {num}
                    </span>
                    <span className="font-bold text-[#005C53]">{selectedShowtime.price} ₽</span>
                  </div>
                );
              })}
            </div>

            {/* Promo code in cart */}
            <div className="pt-2 border-t border-[#F2EFE7] space-y-1.5">
              <div className="flex items-center gap-1 text-[10px] font-bold text-[#7A7A7A]">
                <Tag size={11} className="text-[#005C53]" />
                <span>Промокод (KINO10 или WELCOME20)</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => {
                    setPromoCode(e.target.value.toUpperCase());
                    if (promoFeedback) setPromoFeedback(null);
                  }}
                  placeholder="KINO10"
                  className="flex-1 bg-[#FAF9F5] border border-[#EAE7DF] rounded-xl px-3 py-1.5 text-xs uppercase text-[#1A1A1A] focus:outline-none focus:border-[#005C53]"
                />
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  className="px-3 py-1.5 bg-[#EBF3F2] text-[#005C53] font-bold rounded-xl text-xs cursor-pointer"
                >
                  Ок
                </button>
              </div>
              {promoFeedback && (
                <p
                  className={`text-[10px] font-semibold ${
                    promoFeedback.type === 'ok' ? 'text-[#005C53]' : 'text-red-600'
                  }`}
                >
                  {promoFeedback.text}
                </p>
              )}
            </div>

            {discountPercent > 0 && (
              <div className="flex items-center justify-between text-xs text-[#005C53] font-medium">
                <span>Скидка ({discountPercent}%):</span>
                <span>−{totalPrice - priceAfterPromo} ₽</span>
              </div>
            )}

            {appliedBonuses > 0 && (
              <div className="flex items-center justify-between text-xs text-[#005C53] font-medium">
                <span>Оплата бонусами:</span>
                <span>−{appliedBonuses} ₽</span>
              </div>
            )}

            <div className="pt-3 border-t border-[#F2EFE7] flex items-center justify-between">
              <span className="text-sm font-black text-[#1A1A1A]">Итого:</span>
              <span className="text-lg font-black text-[#005C53]">{finalPrice} ₽</span>
            </div>
          </div>

          {bonusSection}

          <div className="p-3.5 bg-white border border-[#EAE7DF] rounded-2xl text-[11px] text-[#7A7A7A] space-y-1">
            <div className="font-bold text-[#1A1A1A] flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-[#005C53]" />
              <span>Проверьте данные</span>
            </div>
            <div>Проверьте дату, время и выбранные места перед подтверждением и переходом к оплате.</div>
          </div>

          <button
            onClick={onBack}
            className="w-full py-3 bg-white border border-[#EAE7DF] hover:border-[#005C53] text-[#1A1A1A] font-bold rounded-2xl text-xs transition-colors cursor-pointer"
          >
            Изменить места
          </button>
        </div>

        {/* Sticky Proceed CTA */}
        <div className="p-4 bg-white border-t border-[#EAE7DF] flex items-center justify-between shrink-0 shadow-sm">
          <div>
            <div className="text-[11px] text-[#7A7A7A]">Сумма к оплате</div>
            <div className="text-base font-black text-[#005C53]">{finalPrice} ₽</div>
          </div>
          <button
            onClick={() => {
              if (user && useBonuses && bonusError) {
                setErrors((prev) => ({ ...prev, bonuses: bonusError }));
                return;
              }
              setStep('payment');
            }}
            className="px-8 py-3.5 bg-[#005C53] hover:bg-[#046C62] text-white font-bold rounded-2xl text-xs transition-all shadow-sm cursor-pointer"
          >
            Оформить заказ
          </button>
        </div>

        {/* Screen 25 · Отменить заказ? Modal */}
        {showCancelModal && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-5 animate-fade-in">
            <div className="w-full max-w-xs bg-white rounded-3xl p-5 shadow-2xl border border-[#EAE7DF] space-y-3.5 text-center">
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-base font-black text-[#1A1A1A]">Отменить заказ?</h3>
              <p className="text-xs text-[#7A7A7A]">
                Выбранные места будут освобождены. Покупка билетов на фильм «{movie.title}» не будет завершена.
              </p>
              <div className="pt-2 space-y-2">
                <button
                  onClick={onBack}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl text-xs cursor-pointer"
                >
                  Да, отменить заказ
                </button>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="w-full py-2.5 bg-white border border-[#EAE7DF] text-[#1A1A1A] font-bold rounded-2xl text-xs cursor-pointer"
                >
                  Продолжить оформление
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Step 'payment'
  return (
    <div className="flex-1 flex flex-col bg-[#FAF9F5] text-[#1A1A1A] overflow-hidden animate-fade-in relative">
      <div className="p-4 border-b border-[#EAE7DF] bg-white flex items-center justify-between shrink-0">
        <button
          onClick={() => setStep('cart')}
          className="flex items-center gap-1.5 text-xs font-bold text-[#005C53] hover:text-[#046C62] cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>В корзину</span>
        </button>
        <span className="text-base font-black text-[#1A1A1A]">Оплата заказа</span>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4 pb-24">
        {/* Contact details with validation */}
        <div className="bg-white border border-[#EAE7DF] rounded-2xl p-4 space-y-3 shadow-xs">
          <div className="text-xs font-black uppercase tracking-wider text-[#7A7A7A]">
            Контакты для билетов
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[#7A7A7A] mb-1">
              Email для электронных билетов *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: null });
              }}
              placeholder="ivan@example.com"
              className={`w-full bg-[#FAF9F5] border rounded-xl px-3 py-2 text-xs text-[#1A1A1A] focus:outline-none ${
                errors.email ? 'border-red-500' : 'border-[#EAE7DF] focus:border-[#005C53]'
              }`}
            />
            {errors.email && <p className="text-[10px] text-red-600 mt-1">{errors.email}</p>}
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[#7A7A7A] mb-1">Телефон *</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(formatPhoneInput(e.target.value));
                if (errors.phone) setErrors({ ...errors, phone: null });
              }}
              placeholder="+7 (900) 123-45-67"
              className={`w-full bg-[#FAF9F5] border rounded-xl px-3 py-2 text-xs text-[#1A1A1A] focus:outline-none ${
                errors.phone ? 'border-red-500' : 'border-[#EAE7DF] focus:border-[#005C53]'
              }`}
            />
            {errors.phone && <p className="text-[10px] text-red-600 mt-1">{errors.phone}</p>}
          </div>
        </div>

        {/* Auth-only Bonus Panel */}
        {bonusSection}

        {/* Payment method selector */}
        <div className="space-y-2">
          <div className="text-xs font-black uppercase tracking-wider text-[#7A7A7A]">
            Способ оплаты
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod('card')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                paymentMethod === 'card'
                  ? 'bg-[#EBF3F2] border-[#005C53] shadow-xs'
                  : 'bg-white border-[#EAE7DF]'
              }`}
            >
              <CreditCard size={18} className="text-[#005C53] mb-1.5" />
              <div className="text-xs font-bold text-[#1A1A1A]">Карта</div>
              <div className="text-[10px] text-[#7A7A7A]">Мир, Visa</div>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('sbp')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                paymentMethod === 'sbp'
                  ? 'bg-[#EBF3F2] border-[#005C53] shadow-xs'
                  : 'bg-white border-[#EAE7DF]'
              }`}
            >
              <QrCode size={18} className="text-[#005C53] mb-1.5" />
              <div className="text-xs font-bold text-[#1A1A1A]">СБП</div>
              <div className="text-[10px] text-[#7A7A7A]">0% комиссия</div>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('sberpay')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                paymentMethod === 'sberpay'
                  ? 'bg-[#EBF3F2] border-[#005C53] shadow-xs'
                  : 'bg-white border-[#EAE7DF]'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-[9px] flex items-center justify-center mb-1.5">
                S
              </div>
              <div className="text-xs font-bold text-[#1A1A1A]">SberPay</div>
              <div className="text-[10px] text-[#7A7A7A]">В 1 клик</div>
            </button>
          </div>
        </div>

        {/* Card Selection & Form */}
        {paymentMethod === 'card' && (
          <div className="bg-white border border-[#EAE7DF] rounded-2xl p-4 space-y-3 shadow-xs">
            {savedCards.length > 0 && (
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-[#7A7A7A]">Выберите карту</label>
                {savedCards.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedSavedCardId(c.id)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer ${
                      selectedSavedCardId === c.id
                        ? 'bg-[#EBF3F2] border-[#005C53] font-bold text-[#005C53]'
                        : 'bg-[#FAF9F5] border-[#EAE7DF] text-[#1A1A1A]'
                    }`}
                  >
                    <span>
                      {c.label} {c.number}
                    </span>
                    <span className="text-[10px] text-[#7A7A7A]">{c.expiry}</span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setSelectedSavedCardId('new')}
                  className={`w-full p-2.5 rounded-xl border text-xs text-left cursor-pointer ${
                    selectedSavedCardId === 'new'
                      ? 'bg-[#EBF3F2] border-[#005C53] font-bold text-[#005C53]'
                      : 'bg-[#FAF9F5] border-[#EAE7DF] text-[#7A7A7A]'
                  }`}
                >
                  + Ввести другую карту
                </button>
              </div>
            )}

            {(savedCards.length === 0 || selectedSavedCardId === 'new') && (
              <div className="space-y-3 pt-1">
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
                      if (errors.cardNumber) setErrors({ ...errors, cardNumber: null });
                    }}
                    placeholder="2200 1234 5678 4242"
                    className={`w-full bg-[#FAF9F5] border rounded-xl px-3 py-2 text-xs font-mono text-[#1A1A1A] focus:outline-none ${
                      errors.cardNumber ? 'border-red-500' : 'border-[#EAE7DF] focus:border-[#005C53]'
                    }`}
                  />
                  {errors.cardNumber && (
                    <p className="text-[10px] text-red-600 mt-1">{errors.cardNumber}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#7A7A7A] mb-1">
                      Срок действия *
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={cardExpiry}
                      onChange={(e) => {
                        setCardExpiry(formatCardExpiry(e.target.value));
                        if (errors.cardExpiry) setErrors({ ...errors, cardExpiry: null });
                      }}
                      placeholder="12/28"
                      className={`w-full bg-[#FAF9F5] border rounded-xl px-3 py-2 text-xs font-mono text-[#1A1A1A] focus:outline-none ${
                        errors.cardExpiry ? 'border-red-500' : 'border-[#EAE7DF] focus:border-[#005C53]'
                      }`}
                    />
                    {errors.cardExpiry && (
                      <p className="text-[10px] text-red-600 mt-1">{errors.cardExpiry}</p>
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
                        if (errors.cardCvv) setErrors({ ...errors, cardCvv: null });
                      }}
                      placeholder="789"
                      className={`w-full bg-[#FAF9F5] border rounded-xl px-3 py-2 text-xs font-mono text-[#1A1A1A] focus:outline-none ${
                        errors.cardCvv ? 'border-red-500' : 'border-[#EAE7DF] focus:border-[#005C53]'
                      }`}
                    />
                    {errors.cardCvv && (
                      <p className="text-[10px] text-red-600 mt-1">{errors.cardCvv}</p>
                    )}
                  </div>
                </div>

                <label className="flex items-center gap-2 text-[11px] text-[#7A7A7A] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveCardToProfile}
                    onChange={(e) => setSaveCardToProfile(e.target.checked)}
                    className="accent-[#005C53]"
                  />
                  <span>Сохранить карту для следующих покупок</span>
                </label>
              </div>
            )}
          </div>
        )}

        {/* SBP QR screen */}
        {paymentMethod === 'sbp' && (
          <div className="bg-white border border-[#EAE7DF] rounded-2xl p-4 text-center space-y-3 shadow-xs">
            <div className="w-36 h-36 mx-auto bg-[#FAF9F5] border-2 border-dashed border-[#005C53]/40 rounded-2xl flex items-center justify-center p-2">
              <QrCode size={110} className="text-[#005C53]" />
            </div>
            <div className="text-xs text-[#7A7A7A]">
              Отсканируйте QR-код в приложении вашего банка для моментальной оплаты без комиссии
            </div>
          </div>
        )}
      </div>

      {/* Pay CTA */}
      <div className="p-4 bg-white border-t border-[#EAE7DF] flex items-center justify-between shrink-0 shadow-md">
        <div>
          <div className="text-[11px] text-[#7A7A7A]">К списанию</div>
          <div className="text-base font-black text-[#005C53]">{finalPrice} ₽</div>
        </div>
        <button
          onClick={handlePay}
          className="px-8 py-3.5 bg-[#005C53] hover:bg-[#046C62] text-white font-bold rounded-2xl text-xs transition-all shadow-sm cursor-pointer"
        >
          Оплатить {finalPrice} ₽
        </button>
      </div>
    </div>
  );
};
