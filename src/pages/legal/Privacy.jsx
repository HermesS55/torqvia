import { ShieldCheck } from 'lucide-react'
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

function TR() {
  return (
    <>
      <Section title="1. Veri Sorumlusu">
        <p>Bu Gizlilik Politikası, <strong className="text-zinc-200">Torqvia</strong> ("Platform", "Biz") tarafından hazırlanmıştır. Torqvia, kullanıcılarına ait kişisel verilerin işlenmesinde 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında veri sorumlusu sıfatıyla hareket eder.</p>
        <p>İletişim: <strong className="text-zinc-200">destek@torqvia.com</strong></p>
      </Section>

      <Section title="2. Toplanan Kişisel Veriler">
        <p>Platformu kullanmanız sürecinde aşağıdaki kişisel veriler toplanabilir:</p>
        <ul className="list-disc list-inside space-y-1.5 ml-2">
          <li><strong className="text-zinc-300">Kimlik ve iletişim bilgileri:</strong> Ad, soyad, e-posta adresi, telefon numarası</li>
          <li><strong className="text-zinc-300">Profil bilgileri:</strong> Kullanıcı adı, profil fotoğrafı, biyografi, uzmanlık alanı</li>
          <li><strong className="text-zinc-300">Araç ve ilan bilgileri:</strong> Araç marka/model, yıl, kilometre, konum, fotoğraflar</li>
          <li><strong className="text-zinc-300">İçerik verileri:</strong> Paylaşımlar, yorumlar, mesajlar, yüklenen medya dosyaları</li>
          <li><strong className="text-zinc-300">Kullanım verileri:</strong> Sayfa ziyaretleri, tıklamalar, oturum süresi, IP adresi, tarayıcı bilgisi</li>
          <li><strong className="text-zinc-300">Ödeme bilgileri:</strong> Abonelik planı, fatura geçmişi (kart bilgileri Paddle tarafından saklanır, Torqvia erişemez)</li>
        </ul>
      </Section>

      <Section title="3. Verilerin İşlenme Amaçları">
        <p>Kişisel verileriniz aşağıdaki amaçlarla işlenir:</p>
        <ul className="list-disc list-inside space-y-1.5 ml-2">
          <li>Hesap oluşturma, kimlik doğrulama ve hesap güvenliğinin sağlanması</li>
          <li>Platformun temel işlevlerinin (ilanlar, mesajlaşma, topluluk paylaşımları) sunulması</li>
          <li>Üyelik planlarının yönetilmesi ve abonelik işlemlerinin gerçekleştirilmesi</li>
          <li>Kullanıcı destek taleplerinin yanıtlanması</li>
          <li>Platformun iyileştirilmesi ve teknik sorunların giderilmesi</li>
          <li>Yasal yükümlülüklerin yerine getirilmesi</li>
          <li>Toplu ve anonim istatistiksel analizler yapılması</li>
        </ul>
      </Section>

      <Section title="4. Hukuki İşleme Dayanakları">
        <p>Kişisel verileriniz KVKK'nın 5. maddesi kapsamında aşağıdaki hukuki dayanaklar çerçevesinde işlenir:</p>
        <ul className="list-disc list-inside space-y-1.5 ml-2">
          <li><strong className="text-zinc-300">Açık rıza:</strong> Pazarlama bildirimleri ve isteğe bağlı özellikler için</li>
          <li><strong className="text-zinc-300">Sözleşmenin ifası:</strong> Hizmet sunumu ve abonelik yönetimi için</li>
          <li><strong className="text-zinc-300">Meşru menfaat:</strong> Platform güvenliği ve hizmet kalitesinin iyileştirilmesi için</li>
          <li><strong className="text-zinc-300">Yasal yükümlülük:</strong> Vergi, muhasebe ve mevzuat gereklilikleri için</li>
        </ul>
      </Section>

      <Section title="5. Veri Saklama ve Güvenlik">
        <p>Kişisel verileriniz, <strong className="text-zinc-200">Supabase</strong> altyapısı üzerinde şifrelenmiş biçimde saklanır. Supabase'in veri merkezleri AB Veri Koruma düzenlemeleri (GDPR) kapsamında çalışmaktadır.</p>
        <p>Hesabınızı silmeniz durumunda kişisel verileriniz 30 gün içinde sistemlerimizden kalıcı olarak silinir. Yasal zorunluluklar kapsamındaki veriler ise ilgili mevzuatın öngördüğü süre boyunca saklanabilir.</p>
        <p>Verilerinizin yetkisiz erişime karşı korunması için SSL/TLS şifreleme, satır düzeyinde güvenlik politikaları (Row Level Security) ve düzenli güvenlik denetimleri uygulanmaktadır.</p>
      </Section>

      <Section title="6. Üçüncü Taraflarla Veri Paylaşımı">
        <p>Torqvia, kişisel verilerinizi aşağıdaki üçüncü taraflarla sınırlı ve amaçla bağlı şekilde paylaşabilir:</p>
        <ul className="list-disc list-inside space-y-1.5 ml-2">
          <li><strong className="text-zinc-300">Paddle (paddle.com):</strong> Ödeme işlemcisi olarak ad, e-posta ve abonelik bilgilerinize erişebilir. Paddle, Merchant of Record sıfatıyla GDPR uyumlu veri işleme politikalarına tabidir.</li>
          <li><strong className="text-zinc-300">Supabase:</strong> Veritabanı ve kimlik doğrulama altyapısı sağlayıcısı olarak teknik veri işleme yapar.</li>
          <li><strong className="text-zinc-300">Yasal makamlar:</strong> Yetkili mahkeme veya idari mercilerin talebi halinde zorunlu paylaşım yapılabilir.</li>
        </ul>
        <p>Verileriniz ticari amaçlarla üçüncü taraflara satılmaz veya kiralanmaz.</p>
      </Section>

      <Section title="7. Çerezler ve İzleme Teknolojileri">
        <p>Torqvia, oturum yönetimi ve platform performansının ölçülmesi amacıyla zorunlu çerezler kullanır. Bu çerezler olmadan hizmet düzgün çalışmayabilir.</p>
        <p>Analitik veya pazarlama amacıyla üçüncü taraf çerez kullanımı halinde bu durum önceden kullanıcılara bildirilir ve açık rıza alınır.</p>
      </Section>

      <Section title="8. KVKK Kapsamındaki Haklarınız">
        <p>6698 sayılı KVKK'nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:</p>
        <ul className="list-disc list-inside space-y-1.5 ml-2">
          <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
          <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</li>
          <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri öğrenme</li>
          <li>Eksik veya yanlış işlenmiş verilerin düzeltilmesini isteme</li>
          <li>Verilerin silinmesini veya yok edilmesini isteme</li>
          <li>Otomatik sistemlerle analiz edilmesi nedeniyle aleyhe bir sonucun ortaya çıkması halinde itiraz etme</li>
          <li>Kanuna aykırı işleme nedeniyle uğradığınız zararın giderilmesini talep etme</li>
        </ul>
        <p>Bu haklarınızı kullanmak için <strong className="text-zinc-200">destek@torqvia.com</strong> adresine yazabilirsiniz. Talepler en geç 30 gün içinde sonuçlandırılır.</p>
      </Section>

      <Section title="9. Veri Güvenliği İhlali">
        <p>Kişisel verilerinizi etkileyen bir güvenlik ihlali yaşanması halinde, Torqvia yasal yükümlülükler çerçevesinde ilgili kişileri ve Kişisel Verileri Koruma Kurumu'nu gecikmeksizin bilgilendirir.</p>
      </Section>

      <Section title="10. Uluslararası Veri Transferleri">
        <p>Verileriniz, Supabase ve Paddle altyapıları aracılığıyla Avrupa Ekonomik Alanı (AEA) içindeki veya yeterli koruma düzeyine sahip ülkelerdeki sunucularda işlenebilir. Bu transferler KVKK ve GDPR gerekliliklerine uygun standart sözleşme maddeleri kapsamında gerçekleştirilir.</p>
      </Section>

      <Section title="11. Politika Değişiklikleri">
        <p>Torqvia, bu Gizlilik Politikası'nı gerektiğinde güncelleyebilir. Önemli değişiklikler yürürlük tarihinden en az 14 gün önce e-posta veya platform bildirimi yoluyla duyurulur. Güncellenmiş politika, platform üzerinde yayımlandığı tarihten itibaren geçerlidir.</p>
      </Section>

      <Section title="12. İletişim">
        <p>Gizlilik konusundaki sorularınız veya KVKK kapsamındaki haklarınızı kullanmak için:</p>
        <ul className="space-y-1 ml-2">
          <li>📧 <strong className="text-zinc-200">destek@torqvia.com</strong></li>
          <li>🌐 <strong className="text-zinc-200">torqvia.com</strong></li>
        </ul>
      </Section>
    </>
  )
}

function EN() {
  return (
    <>
      <Section title="1. Data Controller">
        <p><strong className="text-zinc-200">Torqvia</strong> ("Platform", "We") acts as the data controller for the processing of personal data belonging to its users, in accordance with applicable data protection laws including the Turkish Personal Data Protection Law No. 6698 (KVKK) and the EU General Data Protection Regulation (GDPR).</p>
        <p>Contact: <strong className="text-zinc-200">destek@torqvia.com</strong></p>
      </Section>

      <Section title="2. Personal Data We Collect">
        <p>The following personal data may be collected as you use the platform:</p>
        <ul className="list-disc list-inside space-y-1.5 ml-2">
          <li><strong className="text-zinc-300">Identity and contact:</strong> Full name, email address, phone number</li>
          <li><strong className="text-zinc-300">Profile information:</strong> Username, profile photo, biography, specialty</li>
          <li><strong className="text-zinc-300">Vehicle and listing data:</strong> Make, model, year, mileage, location, photos</li>
          <li><strong className="text-zinc-300">Content data:</strong> Posts, comments, messages, uploaded media files</li>
          <li><strong className="text-zinc-300">Usage data:</strong> Page visits, clicks, session duration, IP address, browser info</li>
          <li><strong className="text-zinc-300">Payment data:</strong> Subscription plan, billing history (card details are stored by Paddle — Torqvia has no access)</li>
        </ul>
      </Section>

      <Section title="3. Purposes of Processing">
        <p>Your personal data is processed for the following purposes:</p>
        <ul className="list-disc list-inside space-y-1.5 ml-2">
          <li>Account creation, identity verification, and account security</li>
          <li>Delivery of core platform features (listings, messaging, community posts)</li>
          <li>Membership plan management and subscription billing</li>
          <li>Responding to customer support requests</li>
          <li>Improving the platform and resolving technical issues</li>
          <li>Fulfilling legal obligations</li>
          <li>Aggregated, anonymized statistical analysis</li>
        </ul>
      </Section>

      <Section title="4. Legal Bases for Processing">
        <p>Your personal data is processed on the following legal bases:</p>
        <ul className="list-disc list-inside space-y-1.5 ml-2">
          <li><strong className="text-zinc-300">Consent:</strong> For marketing communications and optional features</li>
          <li><strong className="text-zinc-300">Contract performance:</strong> For service delivery and subscription management</li>
          <li><strong className="text-zinc-300">Legitimate interests:</strong> For platform security and service quality improvement</li>
          <li><strong className="text-zinc-300">Legal obligation:</strong> For tax, accounting, and regulatory compliance</li>
        </ul>
      </Section>

      <Section title="5. Data Storage and Security">
        <p>Your personal data is stored in encrypted form on <strong className="text-zinc-200">Supabase</strong> infrastructure. Supabase's data centers operate under EU data protection regulations (GDPR).</p>
        <p>If you delete your account, your personal data will be permanently removed from our systems within 30 days. Data subject to legal retention requirements may be kept for the period mandated by applicable law.</p>
        <p>We employ SSL/TLS encryption, Row Level Security policies, and regular security audits to protect your data from unauthorized access.</p>
      </Section>

      <Section title="6. Third-Party Data Sharing">
        <p>Torqvia may share your personal data with the following third parties, strictly for the stated purposes:</p>
        <ul className="list-disc list-inside space-y-1.5 ml-2">
          <li><strong className="text-zinc-300">Paddle (paddle.com):</strong> As payment processor and Merchant of Record, Paddle may access your name, email, and subscription details. Paddle operates under GDPR-compliant data processing policies.</li>
          <li><strong className="text-zinc-300">Supabase:</strong> Processes technical data as our database and authentication infrastructure provider.</li>
          <li><strong className="text-zinc-300">Legal authorities:</strong> Data may be disclosed upon lawful request by courts or regulatory bodies.</li>
        </ul>
        <p>Your data is never sold or rented to third parties for commercial purposes.</p>
      </Section>

      <Section title="7. Cookies and Tracking Technologies">
        <p>Torqvia uses essential cookies for session management and measuring platform performance. Without these cookies, the service may not function properly.</p>
        <p>If third-party cookies are used for analytics or marketing, users will be informed in advance and explicit consent will be obtained.</p>
      </Section>

      <Section title="8. Your Rights">
        <p>You have the following rights regarding your personal data:</p>
        <ul className="list-disc list-inside space-y-1.5 ml-2">
          <li>Right to know whether your personal data is being processed</li>
          <li>Right to access your personal data and request a copy</li>
          <li>Right to correction of inaccurate or incomplete data</li>
          <li>Right to erasure ("right to be forgotten")</li>
          <li>Right to restriction of processing</li>
          <li>Right to object to automated decision-making</li>
          <li>Right to lodge a complaint with a supervisory authority</li>
        </ul>
        <p>To exercise these rights, contact us at <strong className="text-zinc-200">destek@torqvia.com</strong>. Requests are processed within 30 days.</p>
      </Section>

      <Section title="9. Data Breach Notification">
        <p>In the event of a personal data breach affecting your data, Torqvia will notify affected individuals and relevant supervisory authorities without undue delay, in accordance with applicable legal obligations.</p>
      </Section>

      <Section title="10. International Data Transfers">
        <p>Your data may be processed on servers located within the European Economic Area (EEA) or in countries with adequate data protection levels, through Supabase and Paddle infrastructure. These transfers are carried out under standard contractual clauses compliant with KVKK and GDPR requirements.</p>
      </Section>

      <Section title="11. Policy Changes">
        <p>Torqvia may update this Privacy Policy from time to time. Material changes will be announced via email or platform notification at least 14 days before the effective date. The updated policy takes effect from the date it is published on the platform.</p>
      </Section>

      <Section title="12. Contact">
        <p>For privacy-related questions or to exercise your data rights:</p>
        <ul className="space-y-1 ml-2">
          <li>📧 <strong className="text-zinc-200">destek@torqvia.com</strong></li>
          <li>🌐 <strong className="text-zinc-200">torqvia.com</strong></li>
        </ul>
      </Section>
    </>
  )
}

export default function Privacy() {
  const { lang } = useLang()
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8 pb-6 border-b border-zinc-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-brand-500/10 rounded-xl border border-brand-500/20">
            <ShieldCheck className="h-5 w-5 text-brand-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {lang === 'tr' ? 'Gizlilik Politikası' : 'Privacy Policy'}
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
            ? 'Kişisel verilerinizin nasıl toplandığını, işlendiğini ve korunduğunu açıklamaktadır.'
            : 'This policy explains how your personal data is collected, processed, and protected.'}
        </p>
      </div>

      {lang === 'tr' ? <TR /> : <EN />}
    </div>
  )
}
