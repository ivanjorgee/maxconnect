export type PasswordValidation = {
  ok: boolean;
  message?: string;
};

export function validatePassword(value: string): PasswordValidation {
  if (!value || value.length < 8) {
    return { ok: false, message: "A senha precisa ter pelo menos 8 caracteres." };
  }
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    return { ok: false, message: "A senha deve conter letras e numeros." };
  }
  return { ok: true };
}
