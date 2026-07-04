import { getLocale } from "@/lib/server-i18n";
import LoginForm from "@/components/LoginForm";
import LocaleSwitcher from "@/components/LocaleSwitcher";

export default async function LoginPage() {
  const locale = await getLocale();

  return (
    <div className="login-shell">
      <div style={{ position: "absolute", top: 20, right: 20, width: 90 }}>
        <LocaleSwitcher locale={locale} variant="standalone" />
      </div>
      <LoginForm locale={locale} />
    </div>
  );
}
