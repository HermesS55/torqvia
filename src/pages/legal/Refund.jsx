import { RotateCcw } from 'lucide-react'
import { useLang } from '../../contexts/LangContext'

const EFFECTIVE_DATE = '22 Nisan 2026'
const EFFECTIVE_DATE_EN = 'April 22, 2026'

function Section({ title, children }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
        <span className="h-0.5 w-4 bg-brand-500 rounded-full inline-block" />
        {title}
      </h2>
      <div className="text-zinc-400 text-sm leading-relaxed space-y-3">{children}</div>
    </section>
  )
}

function InfoBox({ children }) {
  return (
    <div className="p-4 rounded-xl bg-brand-500/5 border border-brand-500/20 text-zinc-300 text-sm leading-relaxed">
      {children}
    </div>
  )
}

function TR() {
  return (
    <>
      <Section title="1. Genel İlkeler">
        <p>Bu İade Politikası, <strong className="text-zinc-200">Torqvia</strong> platformundaki ücretli üyelik aboneliklerine ilişkin iade koşullarını açıklar. Bir abonelik satın alarak bu politikayı kabul etmiş sayılırsınız.</p>
        <p>Torqvia'daki tüm ödemeler, Merchant of Record (Satıcı Kaydı) sıfatıyla hareket eden <strong className="text-zinc-200">Paddle</strong> aracılığıyla işlenir. Bu nedenle iade talepleri hem Torqvia politikalarına hem de Paddle'ın iade prosedürlerine tabidir.</p>
      </Section>

      <Section title="2. İlk Satın Alma İadesi (7 Günlük Garanti)">
        <InfoBox>
          <span className="font-semibold text-brand-400">Memnuniyet Garantisi:</span> Torqvia'da ilk kez ücretli bir abonelik satın alan kullanıcılar, satın alma tarihinden itibaren <strong>7 (yedi) gün</strong> içinde tam iade talep edebilir.
        </InfoBox>
        <p>Bu garanti yalnızca şu koşullarda geçerlidir:</p>
        <ul className="list-disc list-inside space-y-1.5 ml-2">
          <li>İlk kez Turbo veya Elite aboneliği satın alan kullanıcılara uygulanır</li>
          <li>Talep, satın alma tarihinden itibaren 7 gün içinde yapılmalıdır</li>
          <li>Daha önce herhangi bir abonelikte iade kullanılmamış olmalıdır</li>
          <li>Hesap bu süre içinde Kullanım Koşulları ihlali nedeniyle askıya alınmamış olmalıdır</li>
        </ul>
      </Section>

      <Section title="3. Yenileme Aboneliklerinde İade">
        <p>Otomatik yenileme ile gerçekleşen abonelik ödemeleri kural olarak iade edilmez. Ancak aşağıdaki istisnai durumlarda değerlendirme yapılır:</p>
        <ul className="list-disc list-inside space-y-1.5 ml-2">
          <li>Yenileme günü iptal işleminizin teknik bir hata nedeniyle gerçekleşmemiş olması</li>
          <li>Ödemenin, aboneliğinizi iptal ettiğinizi doğruladıktan sonra yanlışlıkla çekilmiş olması</li>
          <li>Hizmetin yenileme döneminin büyük bölümünde erişilemez durumda olması (Torqvia kaynaklı kesinti)</li>
        </ul>
        <p>Bu tür durumlarda destek ekibimizle iletişime geçmeniz yeterlidir; her vaka ayrı ayrı değerlendirilir.</p>
      </Section>

      <Section title="4. İade Edilmeyen Durumlar">
        <p>Aşağıdaki durumlarda iade yapılmaz:</p>
        <ul className="list-disc list-inside space-y-1.5 ml-2">
          <li>Abonelik döneminin ortasında planı iptal etme (kalan dönem aktif kalır, kısmi iade uygulanmaz)</li>
          <li>Daha düşük bir plana geçiş yapıldığında önceki dönem için iade</li>
          <li>Kullanım Koşulları ihlali nedeniyle hesabı askıya alınan veya kapatılan kullanıcılar</li>
          <li>7 günlük garanti süresini doldurduktan sonra yapılan ilk satın alma talepleri</li>
          <li>Ücretsiz deneme süresi bulunan promosyonlarda deneme süresi tamamlandıktan sonra yapılan talepler</li>
        </ul>
      </Section>

      <Section title="5. Plan İptali">
        <p>Aboneliğinizi istediğiniz zaman iptal edebilirsiniz. İptal işlemi mevcut fatura döneminin sonunda geçerli olur; kalan süre boyunca plan avantajlarınız devam eder.</p>
        <p>İptal sonrasında hesabınız otomatik olarak <strong className="text-zinc-200">Free</strong> planına geçer. Verileriniz ve profiliniz silinmez.</p>
      </Section>

      <Section title="6. Plan Yükseltme ve Düşürme">
        <ul className="list-disc list-inside space-y-1.5 ml-2">
          <li><strong className="text-zinc-300">Yükseltme (ör. Turbo → Elite):</strong> Anında aktif olur. Kalan dönem için oransal fark tahsil edilir.</li>
          <li><strong className="text-zinc-300">Düşürme (ör. Elite → Turbo):</strong> Mevcut dönem sonunda geçerli olur. Fark iadesi yapılmaz.</li>
        </ul>
      </Section>

      <Section title="7. İade Süreci">
        <p>İade talebinde bulunmak için:</p>
        <ol className="list-decimal list-inside space-y-2 ml-2">
          <li><strong className="text-zinc-300">destek@torqvia.com</strong> adresine e-posta gönderin</li>
          <li>E-postanıza hesap e-postanızı, satın alma tarihini ve iade gerekçenizi belirtin</li>
          <li>Ekibimiz talebi en geç <strong className="text-zinc-300">3 iş günü</strong> içinde değerlendirip size geri döner</li>
          <li>Onaylanan iadeler, ödeme yapılan karta <strong className="text-zinc-300">5-10 iş günü</strong> içinde yansır</li>
        </ol>
        <p>Paddle tarafından işlenen ödemelerde iade süreci Paddle'ın prosedürleri çerçevesinde yürütülür.</p>
      </Section>

      <Section title="8. Teknik Sorunlar Nedeniyle İade">
        <p>Platformun Torqvia kaynaklı teknik arızalar nedeniyle uzun süreli erişilemez hale gelmesi durumunda (kesinti süresi 24 saati aşarsa), etkilenen kullanıcılara orantılı kredi veya iade değerlendirmesi yapılır. Bu tür sorunları <strong className="text-zinc-200">destek@torqvia.com</strong> adresine bildirmenizi rica ederiz.</p>
      </Section>

      <Section title="9. İletişim">
        <p>İade talepleriniz ve soru için:</p>
        <ul className="space-y-1 ml-2">
          <li>📧 <strong className="text-zinc-200">destek@torqvia.com</strong></li>
          <li>🌐 <strong className="text-zinc-200">torqvia.com</strong></li>
        </ul>
        <p className="text-zinc-600 text-xs mt-2">Son güncelleme: {EFFECTIVE_DATE}</p>
      </Section>
    </>
  )
}

function EN() {
  return (
    <>
      <Section title="1. General Principles">
        <p>This Refund Policy explains the conditions under which refunds are issued for paid membership subscriptions on the <strong className="text-zinc-200">Torqvia</strong> platform. By purchasing a subscription, you agree to this policy.</p>
        <p>All payments on Torqvia are processed by <strong className="text-zinc-200">Paddle</strong>, which acts as the Merchant of Record. Refund requests are therefore subject to both Torqvia policies and Paddle's refund procedures.</p>
      </Section>

      <Section title="2. First Purchase Refund (7-Day Guarantee)">
        <InfoBox>
          <span className="font-semibold text-brand-400">Satisfaction Guarantee:</span> Users purchasing a paid subscription on Torqvia for the first time may request a full refund within <strong>7 (seven) days</strong> of the purchase date.
        </InfoBox>
        <p>This guarantee applies only under the following conditions:</p>
        <ul className="list-disc list-inside space-y-1.5 ml-2">
          <li>Applies to first-time purchasers of a Turbo or Elite subscription</li>
          <li>The request must be made within 7 days of the purchase date</li>
          <li>No previous refund has been issued on the account</li>
          <li>The account must not have been suspended for Terms of Service violations during this period</li>
        </ul>
      </Section>

      <Section title="3. Refunds on Renewal Payments">
        <p>As a general rule, automatic renewal payments are non-refundable. However, the following exceptional cases will be reviewed:</p>
        <ul className="list-disc list-inside space-y-1.5 ml-2">
          <li>A cancellation request was not processed due to a technical error on our end</li>
          <li>A payment was charged after you had confirmed cancellation of your subscription</li>
          <li>The service was inaccessible for the majority of the renewal period due to a Torqvia-side outage</li>
        </ul>
        <p>In such cases, please contact our support team and each case will be reviewed individually.</p>
      </Section>

      <Section title="4. Non-Refundable Situations">
        <p>Refunds will not be issued in the following situations:</p>
        <ul className="list-disc list-inside space-y-1.5 ml-2">
          <li>Canceling a subscription mid-period (your plan remains active until period end; no partial refund is issued)</li>
          <li>Downgrading from a higher plan to a lower one (no refund for the remaining period)</li>
          <li>Accounts suspended or terminated for Terms of Service violations</li>
          <li>First-purchase requests made after the 7-day guarantee window has closed</li>
          <li>Requests after a promotional free trial period has ended</li>
        </ul>
      </Section>

      <Section title="5. Canceling Your Subscription">
        <p>You may cancel your subscription at any time. Cancellation takes effect at the end of your current billing period; you retain all plan benefits until then.</p>
        <p>After cancellation, your account automatically reverts to the <strong className="text-zinc-200">Free</strong> plan. Your data and profile are not deleted.</p>
      </Section>

      <Section title="6. Upgrading and Downgrading">
        <ul className="list-disc list-inside space-y-1.5 ml-2">
          <li><strong className="text-zinc-300">Upgrading (e.g. Turbo → Elite):</strong> Takes effect immediately. A prorated difference is charged for the remaining period.</li>
          <li><strong className="text-zinc-300">Downgrading (e.g. Elite → Turbo):</strong> Takes effect at the end of the current billing period. No refund is issued for the difference.</li>
        </ul>
      </Section>

      <Section title="7. Refund Process">
        <p>To request a refund:</p>
        <ol className="list-decimal list-inside space-y-2 ml-2">
          <li>Email <strong className="text-zinc-300">destek@torqvia.com</strong></li>
          <li>Include your account email, purchase date, and reason for the refund request</li>
          <li>Our team will review your request within <strong className="text-zinc-300">3 business days</strong> and respond</li>
          <li>Approved refunds will be returned to the original payment card within <strong className="text-zinc-300">5–10 business days</strong></li>
        </ol>
        <p>For payments processed by Paddle, the refund process follows Paddle's refund procedures.</p>
      </Section>

      <Section title="8. Refunds for Technical Issues">
        <p>If the platform becomes inaccessible for an extended period due to a Torqvia-side technical failure (outage exceeding 24 hours), affected users will be considered for proportional account credits or refunds. Please report such issues to <strong className="text-zinc-200">destek@torqvia.com</strong>.</p>
      </Section>

      <Section title="9. Contact">
        <p>For refund requests and inquiries:</p>
        <ul className="space-y-1 ml-2">
          <li>📧 <strong className="text-zinc-200">destek@torqvia.com</strong></li>
          <li>🌐 <strong className="text-zinc-200">torqvia.com</strong></li>
        </ul>
        <p className="text-zinc-600 text-xs mt-2">Last updated: {EFFECTIVE_DATE_EN}</p>
      </Section>
    </>
  )
}

export default function Refund() {
  const { lang } = useLang()
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8 pb-6 border-b border-zinc-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-brand-500/10 rounded-xl border border-brand-500/20">
            <RotateCcw className="h-5 w-5 text-brand-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {lang === 'tr' ? 'İade Politikası' : 'Refund Policy'}
            </h1>
            <p className="text-xs text-zinc-600 mt-0.5">
              {lang === 'tr'
                ? `Son güncelleme: ${EFFECTIVE_DATE}`
                : `Last updated: ${EFFECTIVE_DATE_EN}`}
            </p>
          </div>
        </div>
        <p className="text-zinc-500 text-sm">
          {lang === 'tr'
            ? 'Ücretli üyelikleriniz için geçerli iade koşullarını ve süreçlerini açıklar.'
            : 'Explains the refund conditions and processes applicable to your paid memberships.'}
        </p>
      </div>

      {lang === 'tr' ? <TR /> : <EN />}
    </div>
  )
}
