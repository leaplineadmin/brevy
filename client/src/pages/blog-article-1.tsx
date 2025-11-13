import { Link } from "wouter";
import Navbar from "@/components/layout/navbar";
import { useLanguage } from "@/contexts/LanguageContext";
import { SEOHead } from "@/components/SEOHead";
import { MarkdownRenderer } from "@/components/shared/markdown-renderer";
import { BlogPostingSchema } from "@/components/BlogPostingSchema";
import { getArticleBySlug, getRelatedArticles } from "@/lib/blog-data";

const articleContent = {
  fr: `# Comment Créer un CV Professionnel en 2025 : Le Guide Complet (+ Modèles Gratuits)

Dans un marché du travail de plus en plus compétitif, un CV bien conçu n'est plus une option, c'est une nécessité. C'est votre première chance de faire une impression mémorable auprès d'un recruteur. Mais par où commencer ? Comment structurer l'information ? Quel design choisir ?

Ne vous inquiétez pas. Que vous soyez un jeune diplômé ou un professionnel expérimenté, ce guide complet vous montrera, étape par étape, **comment créer un CV professionnel et percutant en 2025**.

## 1. Comprendre les Attentes des Recruteurs en 2025

Avant de rédiger la première ligne, il est crucial de comprendre ce que les recruteurs recherchent aujourd'hui :

- **Clarté et Lisibilité :** Un recruteur passe en moyenne **6 à 7 secondes** sur un CV. Votre document doit être facile à lire et aller droit au but.
- **Pertinence :** Votre CV doit être personnalisé pour chaque offre d'emploi. Les CV génériques finissent souvent à la poubelle.
- **Optimisation pour les ATS (Applicant Tracking Systems) :** Plus de 90% des grandes entreprises utilisent des logiciels pour trier les CV. Votre document doit contenir les bons mots-clés pour passer ce premier filtre.
- **Impact Visuel :** Un design soigné et professionnel peut faire toute la différence, mais attention à ne pas en faire trop.

> **Le saviez-vous ?** Un CV avec un design professionnel et une structure claire a **40% de chances en plus** d'être lu en détail par un recruteur.

## 2. Choisir le Bon Format de CV

Il existe trois formats de CV principaux. Le choix dépend de votre parcours et de votre situation.

| Type de Format | Idéal Pour | Avantages | Inconvénients |
| :--- | :--- | :--- | :--- |
| **Antichronologique** | La plupart des candidats | Met en avant l'expérience récente, facile à lire. | Peut exposer des trous dans le parcours. |
| **Fonctionnel (par compétences)** | Changement de carrière, trous dans le parcours | Met l'accent sur les compétences plutôt que sur la chronologie. | Souvent mal perçu par les recruteurs. |
| **Combiné (ou mixte)** | Experts, professionnels avec des compétences variées | Combine les avantages des deux autres formats. | Peut devenir long et complexe. |

**Notre recommandation pour 2025 :** Optez pour le **format antichronologique**. C'est le standard de l'industrie et celui que les recruteurs préfèrent.

## 3. Les Sections Indispensables de Votre CV

Voici la structure parfaite pour un CV professionnel. Chaque section a un rôle précis.

### A. En-tête : Vos Coordonnées

C'est la première chose que le recruteur verra. Soyez clair et professionnel.

- **Nom et Prénom :** En grand et bien visible.
- **Titre du Poste :** Le poste que vous visez (ex: "Développeur Web Full-Stack", "Chef de Projet Marketing Digital").
- **Numéro de Téléphone :** Un numéro où vous êtes facilement joignable.
- **Adresse E-mail :** Une adresse professionnelle (ex: \`prenom.nom@email.com\`).
- **Ville et Pays :** Pas besoin de votre adresse complète.
- **Lien vers votre profil LinkedIn :** Indispensable en 2025.
- **(Optionnel) Lien vers votre portfolio ou site personnel :** Un atout majeur si vous travaillez dans la création, le développement ou le marketing.

### B. Accroche : Le Résumé de Carrière

Juste après l'en-tête, cette section de 2 à 3 lignes doit résumer qui vous êtes et ce que vous apportez. C'est votre "pitch".

**Exemple pour un développeur :**
> *Développeur Web passionné avec 5 ans d'expérience dans la création d'applications React performantes. Spécialisé en optimisation de la performance et en expérience utilisateur, je cherche à apporter mes compétences techniques et ma créativité à une équipe innovante.*

### C. Expérience Professionnelle

C'est le cœur de votre CV. Pour chaque expérience, listez :

- **Titre du poste**
- **Nom de l'entreprise et ville**
- **Dates (mois et année)**
- **3 à 5 points (bullet points) décrivant vos missions et, surtout, vos réalisations.**

**L'astuce qui change tout :** Quantifiez vos réalisations. Ne dites pas "*Gestion des réseaux sociaux*", mais plutôt "*Augmentation de l'engagement sur Instagram de 25% en 6 mois grâce à une nouvelle stratégie de contenu*."

### D. Formation

Soyez concis. Listez vos diplômes les plus récents en premier.

- **Nom du diplôme**
- **Nom de l'établissement et ville**
- **Année d'obtention**

### E. Compétences

Créez des sous-sections pour plus de clarté.

- **Compétences Techniques (Hard Skills) :** Langages de programmation, logiciels, outils marketing...
- **Compétences Interpersonnelles (Soft Skills) :** Communication, travail d'équipe, résolution de problèmes, leadership...
- **Langues :** Précisez votre niveau (ex: Anglais - Courant (C1), Espagnol - Notions (A2)).

> **Conseil d'expert :** Reprenez les mots-clés de l'offre d'emploi dans cette section pour passer les filtres ATS.

## 4. Mettre en Page Votre CV : L'Impact Visuel

Un bon contenu mérite un bon design. Mais simplicité et professionnalisme sont les maîtres-mots.

- **Police de caractères :** Choisissez une police lisible et moderne (Calibri, Arial, Helvetica, Lato).
- **Taille de la police :** Entre 10 et 12 points pour le corps du texte, et 14 à 18 points pour les titres.
- **Marges :** Des marges suffisantes (environ 2 cm) pour aérer le document.
- **Couleurs :** Utilisez la couleur avec parcimonie. Une touche de couleur pour les titres peut suffire.
- **Longueur :** **Une seule page** est la norme pour la plupart des candidats. Deux pages sont acceptables si vous avez plus de 10 ans d'expérience très pertinente.

Vous n'êtes pas designer ? Ce n'est pas un problème. Des outils en ligne peuvent vous aider à créer un CV au design impeccable en quelques clics.

> **Passez au niveau supérieur avec Brevy :** Créer un CV au design parfait peut être long et frustrant. Avec **Brevy**, choisissez parmi des modèles interactifs professionnels, personnalisez les couleurs en un clic et obtenez un résultat impeccable sans aucune compétence en design. [Essayez Brevy gratuitement dès maintenant !](https://brevy.me/)

## 5. L'Atout Maître en 2025 : Le CV Interactif

Le CV papier traditionnel a ses limites. Pour vraiment vous démarquer, pensez au **CV interactif**.

Un CV interactif est une version en ligne de votre CV, accessible via un lien unique. Il vous permet d'ajouter :

- Des liens cliquables pour vous contacter.
- Des animations subtiles qui captent l'attention.

C'est le meilleur moyen de montrer concrètement vos compétences et de laisser une impression inoubliable.

> **Brevy** est spécialisé dans la création de CV interactifs. En quelques minutes, vous pouvez publier un CV en ligne, responsive, et le partager avec les recruteurs. Mettez à jour votre CV, et le lien partagé est instantanément mis à jour. C'est simple, moderne et incroyablement efficace.

## 6. Relecture et Finalisation : L'Étape à ne Jamais Sauter

Une faute d'orthographe peut ruiner tous vos efforts. Avant d'envoyer votre CV :

1.  **Utilisez un correcteur orthographique et grammatical.**
2.  **Lisez votre CV à voix haute** pour repérer les phrases mal formulées.
3.  **Faites-le relire par au moins deux personnes différentes.** Un regard neuf est précieux.
4.  **Exportez au format PDF.** C'est le seul format qui garantit que votre mise en page ne sera pas altérée.

## Conclusion : Votre CV est Prêt à Convaincre

Créer un CV professionnel en 2025 demande de la méthode et de la stratégie. En suivant ces étapes, vous avez toutes les clés en main pour créer un document qui non seulement passera les filtres ATS, mais qui saura aussi capter l'attention des recruteurs.

**Récapitulatif des points clés :**

- **Clarté et Pertinence** avant tout.
- **Quantifiez vos réalisations** pour prouver votre impact.
- **Soignez le design** sans en faire trop.
- **Pensez au CV interactif** pour vous démarquer.
- **Relisez, relisez, et relisez encore.**

Prêt à passer à l'action ? Ne perdez plus de temps avec des mises en page compliquées sur Word.

[Créez votre CV professionnel et interactif en moins de 10 minutes avec Brevy !](https://brevy.me/)`,
  
  en: `# How to Create a Professional Resume in 2025: The Complete Guide (+ Free Templates)

In an increasingly competitive job market, a well-designed resume is no longer an option—it's a necessity. It's your first chance to make a memorable impression on a recruiter. But where do you start? How do you structure the information? What design should you choose?

Don't worry. Whether you're a recent graduate or an experienced professional, this complete guide will show you, step by step, **how to create a professional and impactful resume in 2025**.

## 1. Understanding Recruiter Expectations in 2025

Before writing the first line, it's crucial to understand what recruiters are looking for today:

- **Clarity and Readability:** A recruiter spends an average of **6 to 7 seconds** on a resume. Your document must be easy to read and get straight to the point.
- **Relevance:** Your resume must be tailored to each job posting. Generic resumes often end up in the trash.
- **ATS Optimization (Applicant Tracking Systems):** More than 90% of large companies use software to sort resumes. Your document must contain the right keywords to pass this first filter.
- **Visual Impact:** A polished and professional design can make all the difference, but be careful not to overdo it.

> **Did you know?** A resume with a professional design and clear structure has **40% more chances** of being read in detail by a recruiter.

## 2. Choosing the Right Resume Format

There are three main resume formats. The choice depends on your background and situation.

| Format Type | Ideal For | Advantages | Disadvantages |
| :--- | :--- | :--- | :--- |
| **Reverse Chronological** | Most candidates | Highlights recent experience, easy to read. | May expose gaps in your career. |
| **Functional (by skills)** | Career change, gaps in career | Emphasizes skills rather than chronology. | Often poorly perceived by recruiters. |
| **Combined (or hybrid)** | Experts, professionals with varied skills | Combines the advantages of the other two formats. | Can become long and complex. |

**Our recommendation for 2025:** Choose the **reverse chronological format**. It's the industry standard and the one recruiters prefer.

## 3. Essential Sections of Your Resume

Here is the perfect structure for a professional resume. Each section has a specific role.

### A. Header: Your Contact Information

This is the first thing the recruiter will see. Be clear and professional.

- **Name:** Large and clearly visible.
- **Job Title:** The position you're targeting (e.g., "Full-Stack Web Developer", "Digital Marketing Project Manager").
- **Phone Number:** A number where you're easily reachable.
- **Email Address:** A professional address (e.g., \`firstname.lastname@email.com\`).
- **City and Country:** No need for your full address.
- **Link to your LinkedIn profile:** Essential in 2025.
- **(Optional) Link to your portfolio or personal website:** A major asset if you work in creative, development, or marketing.

### B. Hook: Career Summary

Right after the header, this 2 to 3 line section should summarize who you are and what you bring. It's your "pitch".

**Example for a developer:**
> *Passionate Web Developer with 5 years of experience creating high-performance React applications. Specialized in performance optimization and user experience, I seek to bring my technical skills and creativity to an innovative team.*

### C. Professional Experience

This is the heart of your resume. For each experience, list:

- **Job title**
- **Company name and city**
- **Dates (month and year)**
- **3 to 5 bullet points describing your responsibilities and, most importantly, your achievements.**

**The game-changing tip:** Quantify your achievements. Don't say "*Social media management*", but rather "*Increased Instagram engagement by 25% in 6 months through a new content strategy*."

### D. Education

Be concise. List your most recent degrees first.

- **Degree name**
- **Institution name and city**
- **Year of graduation**

### E. Skills

Create subsections for more clarity.

- **Technical Skills (Hard Skills):** Programming languages, software, marketing tools...
- **Interpersonal Skills (Soft Skills):** Communication, teamwork, problem-solving, leadership...
- **Languages:** Specify your level (e.g., English - Fluent (C1), Spanish - Basic (A2)).

> **Expert tip:** Use the keywords from the job posting in this section to pass ATS filters.

## 4. Formatting Your Resume: Visual Impact

Good content deserves good design. But simplicity and professionalism are key.

- **Font:** Choose a readable and modern font (Calibri, Arial, Helvetica, Lato).
- **Font size:** Between 10 and 12 points for body text, and 14 to 18 points for headings.
- **Margins:** Sufficient margins (about 2 cm) to space out the document.
- **Colors:** Use color sparingly. A touch of color for headings or icons can be enough.
- **Length:** **One page** is the norm for most candidates. Two pages are acceptable if you have more than 10 years of very relevant experience.

Not a designer? That's not a problem. Online tools can help you create a perfectly designed resume in just a few clicks.

> **Take it to the next level with Brevy:** Creating a perfectly designed resume can be time-consuming and frustrating. With **Brevy**, choose from dozens of professional interactive templates, customize colors with one click, and get a flawless result without any design skills. [Try Brevy for free now!](https://brevy.me/)

## 5. The Master Asset in 2025: The Interactive Resume

Traditional paper resumes have their limits. To really stand out, think about an **interactive resume**.

An interactive resume is an online version of your resume, accessible via a unique link. It allows you to add:

- Clickable links to contact you.
- Subtle animations that capture attention.

It's the best way to concretely show your skills and leave an unforgettable impression.

> **Brevy** specializes in creating interactive resumes. In just a few minutes, you can publish an online, responsive resume and share it with recruiters. Update your resume, and the shared link is instantly updated. It's simple, modern, and incredibly effective.

## 6. Proofreading and Finalization: The Step You Should Never Skip

A spelling mistake can ruin all your efforts. Before sending your resume:

1.  **Use a spelling and grammar checker.**
2.  **Read your resume out loud** to spot poorly worded sentences.
3.  **Have it proofread by at least two different people.** A fresh perspective is valuable.
4.  **Export to PDF format.** It's the only format that guarantees your layout won't be altered.

## Conclusion: Your Resume is Ready to Convince

Creating a professional resume in 2025 requires method and strategy. By following these steps, you have all the keys to create a document that will not only pass ATS filters but also capture recruiters' attention.

**Summary of key points:**

- **Clarity and Relevance** above all.
- **Quantify your achievements** to prove your impact.
- **Polish the design** without overdoing it.
- **Think about an interactive resume** to stand out.
- **Proofread, proofread, and proofread again.**

Ready to take action? Stop wasting time with complicated layouts in Word.

[Create your professional and interactive resume in less than 10 minutes with Brevy!](https://brevy.me/)`
};

export default function BlogArticle1() {
  const { language } = useLanguage();
  const content = articleContent[language as keyof typeof articleContent] || articleContent.fr;

  // Get article data from centralized source
  const article = getArticleBySlug('how-to-create-professional-resume-2025');
  const relatedArticles = getRelatedArticles('how-to-create-professional-resume-2025', 2);

  const articleTitle = article?.title[language as 'en' | 'fr'] || article?.title.en || '';
  const articleDescription = article?.description[language as 'en' | 'fr'] || article?.description.en || '';
  const articleKeywords = article?.keywords?.[language as 'en' | 'fr'] || article?.keywords?.en || '';
  const canonicalUrl = `https://brevy.me/blog/${article?.slug || 'how-to-create-professional-resume-2025'}`;

  if (!article) {
    return null;
  }

  return (
    <>
      <SEOHead
        lang={language}
        customTitle={`${articleTitle} | Brevy`}
        customDescription={articleDescription}
        customKeywords={articleKeywords}
        customCanonical={canonicalUrl}
        customOgImage={article.image}
        isArticle={true}
        articlePublishedTime={article.publishedTime}
        articleModifiedTime={article.modifiedTime || article.publishedTime}
      />
      <BlogPostingSchema
        headline={articleTitle}
        description={articleDescription}
        image={article.image}
        url={canonicalUrl}
        publishedTime={article.publishedTime}
        modifiedTime={article.modifiedTime || article.publishedTime}
      />
      <div className="min-h-screen bg-light">
        <Navbar />
        <div className="mx-auto px-8 max-w-[1280px] py-12">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="mb-6">
              <Link href="/blog">
                <span className="text-blue-600 hover:text-blue-800 cursor-pointer">
                  ← {language === "fr" ? "Retour aux articles" : "Back to articles"}
                </span>
              </Link>
            </div>
            <article className="prose prose-lg max-w-none">
              <MarkdownRenderer content={content} />
            </article>

            {/* Related Articles Section */}
            {relatedArticles.length > 0 && (
              <div className="mt-12 pt-8 border-t border-gray-200">
                <h2 className="text-2xl font-bold text-[#1a1a2e] mb-6">
                  {language === "fr" ? "Articles similaires" : "Related Articles"}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {relatedArticles.map((relatedArticle) => (
                    <Link key={relatedArticle.slug} href={`/blog/${relatedArticle.slug}`}>
                      <div className="bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition-colors cursor-pointer">
                        <h3 className="text-xl font-bold text-[#1a1a2e] mb-2">
                          {relatedArticle.title[language as 'en' | 'fr'] || relatedArticle.title.en}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          {relatedArticle.description[language as 'en' | 'fr'] || relatedArticle.description.en}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
