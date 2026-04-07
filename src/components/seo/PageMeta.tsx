import { Helmet } from "react-helmet-async";

interface PageMetaProps {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  keywords?: string;
  type?: string;
}

const BASE_URL = "https://tartelea.lovable.app";
const DEFAULT_DESC = "المدرسة الترتيلية - منصة تعليمية متخصصة في اللسان العربي المبين وعلوم القرآن الكريم. تعلّم الجذور العربية وتدبّر كلام الله. دورات، ورش عمل، غرف صوتية ومجتمع تفاعلي.";
const DEFAULT_KEYWORDS = "المدرسة الترتيلية, اللسان العربي المبين, علوم القرآن, تدبر القرآن, الجذور العربية, ترتيل القرآن, تعلم العربية";

const PageMeta = ({ title, description, path = "/", image, keywords, type = "website" }: PageMetaProps) => {
  const fullTitle = `${title} | المدرسة الترتيلية`;
  const desc = description || DEFAULT_DESC;
  const url = `${BASE_URL}${path}`;
  const ogImage = image || `${BASE_URL}/favicon.png`;
  const allKeywords = keywords ? `${DEFAULT_KEYWORDS}, ${keywords}` : DEFAULT_KEYWORDS;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <meta name="keywords" content={allKeywords} />
      <link rel="canonical" href={url} />
      <meta property="og:site_name" content="المدرسة الترتيلية" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:alt" content={title} />
      <meta property="og:type" content={type} />
      <meta property="og:locale" content="ar_AR" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
};

export default PageMeta;
