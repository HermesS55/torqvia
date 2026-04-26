import { FileText } from 'lucide-react'
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
      <Section title="1. Taraflar ve Kapsam">
        <p>Bu Kullanım Koşulları ("Koşullar"), <strong className="text-zinc-200">Torqvia</strong> ("Platform", "Biz") ile platformu kullanan bireyler veya işletmeler ("Kullanıcı", "Siz") arasındaki hukuki ilişkiyi düzenler. Torqvia'ya erişerek veya hesap oluşturarak bu Koşulları kabul etmiş sayılırsınız.</p>
        <p>Bu Koşullar, <strong className="text-zinc-200">{EFFECTIVE_DATE}</strong> tarihinden itibaren geçerlidir.</p>
      </Section>

      <Section title="2. Hizmetin Tanımı">
        <p>Torqvia, araç sahipleri ile otomotiv servis uzmanlarını buluşturan bir topluluk platformudur. Platform aracılığıyla kullanıcılar:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Araç ilanı oluşturabilir ve yönetebilir</li>
          <li>Servis teklifleri gönderip alabilir</li>
          <li>Topluluk paylaşımları yapabilir (metin, fotoğraf, video)</li>
          <li>Diğer kullanıcılarla mesajlaşabilir</li>
          <li>Ücretli üyelik planlarına abone olabilir</li>
        </ul>
      </Section>

      <Section title="3. Hesap Oluşturma ve Güvenlik">
        <p>Hesap oluşturmak için geçerli bir e-posta adresi ve telefon numarası sağlamanız zorunludur. Hesap bilgilerinizin doğruluğundan ve gizliliğinden tamamen siz sorumlusunuz. Hesabınızın yetkisiz kullanımını fark etmeniz durumunda derhal <strong className="text-zinc-200">destek@torqvia.com</strong> adresine bildirim yapmalısınız.</p>
        <p>Bir hesap yalnızca gerçek bir kişi veya meşru bir işletme tarafından oluşturulabilir. Otomatik araçlar, botlar veya sahte kimliklerle hesap oluşturmak kesinlikle yasaktır.</p>
      </Section>

      <Section title="4. Üyelik Planları ve Ödeme">
        <p>Torqvia üç üyelik katmanı sunar: <strong className="text-zinc-200">Free</strong> (ücretsiz), <strong className="text-zinc-200">Turbo</strong> ve <strong className="text-zinc-200">Elite</strong>. Ücretli planlar aylık abonelik modeliyle çalışır.</p>
        <p>Tüm ödemeler <strong className="text-zinc-200">Paddle</strong> (paddle.com) aracılığıyla işlenir. Paddle, ödeme işlemlerinde Satıcı Kaydı (Merchant of Record) olarak hareket eder; bu nedenle faturanız Paddle tarafından kesilir. Abonelik fiyatları platform üzerinde açıkça belirtilmektedir. Torqvia, fiyatları önceden duyurmak kaydıyla değiştirme hakkını saklı tutar.</p>
        <p>Mevcut dönem sona ermeden yapılan iptallar, dönem sonuna kadar aktif kalır; kısmi iade yapılmaz. İade koşulları için lütfen <strong className="text-zinc-200">İade Politikamızı</strong> inceleyiniz.</p>
      </Section>

      <Section title="5. Kullanıcı İçeriği">
        <p>Platformda paylaştığınız fotoğraf, video, metin ve diğer içeriklerin ("İçerik") telif hakkı size aittir. Ancak bu İçeriği Torqvia'ya yükleyerek, platformun işletilmesi amacıyla İçeriğinizi kullanma, depolama, görüntüleme ve dağıtma konusunda bize münhasır olmayan, telif ücretsiz, dünya genelinde bir lisans tanımış olursunuz.</p>
        <p>Aşağıdaki içerikler kesinlikle yasaktır:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Hakaret, iftira veya nefret söylemi içeren paylaşımlar</li>
          <li>Başkalarının telif hakkını ihlal eden materyaller</li>
          <li>Yanıltıcı veya dolandırıcılık amaçlı içerikler</li>
          <li>Cinsel, şiddet içeren veya yasadışı materyaller</li>
          <li>Spam veya reklam amaçlı kitlesel mesajlaşma</li>
        </ul>
      </Section>

      <Section title="6. Yasaklı Kullanımlar">
        <p>Platformu aşağıdaki amaçlarla kullanamazsınız:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Hizmetin güvenliğini veya bütünlüğünü tehlikeye atma girişimleri</li>
          <li>Başka kullanıcıların hesaplarına izinsiz erişim</li>
          <li>Torqvia'yı rakip bir ürün veya hizmet geliştirmek amacıyla kullanma</li>
          <li>Otomatik araçlarla veri toplama (scraping)</li>
          <li>Türkiye Cumhuriyeti yasaları veya uluslararası hukuka aykırı her türlü faaliyet</li>
        </ul>
      </Section>

      <Section title="7. Fikri Mülkiyet">
        <p>Torqvia markası, logosu, tasarımı, yazılımı ve tüm platform içerikleri (kullanıcı içeriği hariç) münhasıran Torqvia'ya aittir ve tüm hakları saklıdır. Bu Koşullar, size söz konusu fikri mülkiyet hakları üzerinde herhangi bir lisans vermez.</p>
      </Section>

      <Section title="8. Sorumluluğun Sınırlandırılması">
        <p>Torqvia, platformu "olduğu gibi" ve "mevcut haliyle" sunar. Hizmetin kesintisiz, hatasız veya tamamen güvenli olacağını garanti etmez. Torqvia'nın platformun kullanımından kaynaklanan dolaylı, arızi veya sonuç niteliğindeki zararlardan sorumluluğu, yürürlükteki mevzuatın izin verdiği azami ölçüde sınırlıdır.</p>
      </Section>

      <Section title="9. Hesap Askıya Alma ve Fesih">
        <p>Torqvia, bu Koşulları ihlal eden veya platformun güvenliğini tehdit eden kullanıcıların hesabını önceden bildirim yapmaksızın askıya alma veya kalıcı olarak kapatma hakkını saklı tutar. Hesabınızı kapatmak istemeniz durumunda <strong className="text-zinc-200">destek@torqvia.com</strong> adresinden talepte bulunabilirsiniz.</p>
      </Section>

      <Section title="10. Değişiklikler">
        <p>Torqvia, bu Koşulları dilediği zaman değiştirme hakkını saklı tutar. Önemli değişiklikler, yürürlük tarihinden en az 14 gün önce e-posta veya platform bildirimi yoluyla duyurulur. Değişiklik tarihinden sonra platformu kullanmaya devam etmeniz, güncellenmiş Koşulları kabul ettiğiniz anlamına gelir.</p>
      </Section>

      <Section title="11. Uygulanacak Hukuk ve Uyuşmazlık Çözümü">
        <p>Bu Koşullar, Türkiye Cumhuriyeti hukukuna tabidir. Taraflar arasında doğacak uyuşmazlıklarda öncelikle dostane çözüm yolları denenir; sonuç alınamaması halinde İstanbul Merkez Mahkemeleri ve İcra Daireleri yetkilidir.</p>
      </Section>

      <Section title="12. İletişim">
        <p>Bu Koşullara ilişkin sorularınız için:</p>
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
      <Section title="1. Parties and Scope">
        <p>These Terms of Service ("Terms") govern the legal relationship between <strong className="text-zinc-200">Torqvia</strong> ("Platform", "We") and individuals or businesses using the platform ("User", "You"). By accessing Torqvia or creating an account, you agree to these Terms.</p>
        <p>These Terms are effective as of <strong className="text-zinc-200">{EFFECTIVE_DATE_EN}</strong>.</p>
      </Section>

      <Section title="2. Description of Service">
        <p>Torqvia is a community platform connecting vehicle owners with automotive service professionals. Through the platform, users may:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Create and manage vehicle listings</li>
          <li>Send and receive service offers</li>
          <li>Share community posts (text, photos, videos)</li>
          <li>Message other users directly</li>
          <li>Subscribe to paid membership plans</li>
        </ul>
      </Section>

      <Section title="3. Account Registration and Security">
        <p>A valid email address and phone number are required to create an account. You are solely responsible for the accuracy of your account information and maintaining its confidentiality. If you discover unauthorized use of your account, you must immediately notify us at <strong className="text-zinc-200">destek@torqvia.com</strong>.</p>
        <p>Accounts may only be created by real individuals or legitimate businesses. Creating accounts through automated tools, bots, or false identities is strictly prohibited.</p>
      </Section>

      <Section title="4. Membership Plans and Payment">
        <p>Torqvia offers three membership tiers: <strong className="text-zinc-200">Free</strong>, <strong className="text-zinc-200">Turbo</strong>, and <strong className="text-zinc-200">Elite</strong>. Paid plans operate on a monthly subscription basis.</p>
        <p>All payments are processed through <strong className="text-zinc-200">Paddle</strong> (paddle.com), which acts as the Merchant of Record for payment processing. Your invoice will be issued by Paddle. Subscription prices are clearly stated on the platform. Torqvia reserves the right to change prices with advance notice.</p>
        <p>Cancellations made before the end of the current period remain active until period end; partial refunds are not issued. Please review our <strong className="text-zinc-200">Refund Policy</strong> for full details.</p>
      </Section>

      <Section title="5. User Content">
        <p>You retain copyright ownership of photos, videos, text, and other content ("Content") you share on the platform. By uploading Content to Torqvia, you grant us a non-exclusive, royalty-free, worldwide license to use, store, display, and distribute your Content for the purpose of operating the platform.</p>
        <p>The following content is strictly prohibited:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Defamatory, harassing, or hate speech</li>
          <li>Materials infringing third-party copyrights</li>
          <li>Misleading or fraudulent content</li>
          <li>Sexual, violent, or illegal materials</li>
          <li>Spam or mass commercial messaging</li>
        </ul>
      </Section>

      <Section title="6. Prohibited Uses">
        <p>You may not use the platform to:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Attempt to compromise platform security or integrity</li>
          <li>Access other users' accounts without authorization</li>
          <li>Use Torqvia to develop a competing product or service</li>
          <li>Collect data through automated tools (scraping)</li>
          <li>Engage in any activity contrary to Turkish law or international law</li>
        </ul>
      </Section>

      <Section title="7. Intellectual Property">
        <p>The Torqvia brand, logo, design, software, and all platform content (excluding user content) are exclusively owned by Torqvia and all rights are reserved. These Terms do not grant you any license over such intellectual property rights.</p>
      </Section>

      <Section title="8. Limitation of Liability">
        <p>Torqvia provides the platform "as is" and "as available". We do not guarantee uninterrupted, error-free, or completely secure service. Torqvia's liability for indirect, incidental, or consequential damages arising from platform use is limited to the maximum extent permitted by applicable law.</p>
      </Section>

      <Section title="9. Account Suspension and Termination">
        <p>Torqvia reserves the right to suspend or permanently close accounts of users who violate these Terms or threaten platform security, without prior notice. To request account deletion, contact us at <strong className="text-zinc-200">destek@torqvia.com</strong>.</p>
      </Section>

      <Section title="10. Changes">
        <p>Torqvia reserves the right to modify these Terms at any time. Material changes will be announced via email or platform notification at least 14 days before the effective date. Continued use of the platform after the change date constitutes acceptance of the updated Terms.</p>
      </Section>

      <Section title="11. Governing Law and Dispute Resolution">
        <p>These Terms are governed by the laws of the Republic of Turkey. Disputes between the parties shall first be resolved through amicable means; failing that, Istanbul Central Courts and Enforcement Offices shall have jurisdiction.</p>
      </Section>

      <Section title="12. Contact">
        <p>For questions regarding these Terms:</p>
        <ul className="space-y-1 ml-2">
          <li>📧 <strong className="text-zinc-200">destek@torqvia.com</strong></li>
          <li>🌐 <strong className="text-zinc-200">torqvia.com</strong></li>
        </ul>
      </Section>
    </>
  )
}

export default function Terms() {
  const { lang } = useLang()
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8 pb-6 border-b border-zinc-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-brand-500/10 rounded-xl border border-brand-500/20">
            <FileText className="h-5 w-5 text-brand-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {lang === 'tr' ? 'Kullanım Koşulları' : 'Terms of Service'}
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
            ? 'Torqvia platformunu kullanmadan önce bu koşulları dikkatlice okuyunuz.'
            : 'Please read these terms carefully before using the Torqvia platform.'}
        </p>
      </div>

      {lang === 'tr' ? <TR /> : <EN />}
    </div>
  )
}
