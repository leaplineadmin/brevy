import { Helmet } from "react-helmet-async";

/**
 * Google Analytics component
 * Loads the Google Analytics script on all pages
 */
export const GoogleAnalytics = () => {
  return (
    <Helmet>
      {/* Google tag (gtag.js) */}
      <script async src="https://www.googletagmanager.com/gtag/js?id=G-RZK3DRL6LH"></script>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-RZK3DRL6LH');
          `,
        }}
      />
    </Helmet>
  );
};

