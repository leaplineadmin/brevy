import jsPDF from "jspdf";

export async function generatePDFWithText(
  cvData: any,
  templateId: string,
  mainColor: string,
  language: "en" | "fr" = "en",
  subdomain?: string,
): Promise<void> {
  try {
    const sectionTitles = {
      en: {
        profile: "PROFILE",
        experience: "PROFESSIONAL EXPERIENCE",
        education: "EDUCATION",
        skills: "SKILLS & TOOLS",
        languages: "LANGUAGES",
        certifications: "CERTIFICATIONS",
      },
      fr: {
        profile: "PROFIL",
        experience: "EXPÉRIENCE PROFESSIONNELLE",
        education: "FORMATION",
        skills: "COMPÉTENCES & OUTILS",
        languages: "LANGUES",
        certifications: "CERTIFICATIONS",
      },
    };

    const titles = sectionTitles[language];

    // Personal info
    const personalInfo = cvData.personalInfo || cvData;
    const firstName = personalInfo?.firstName || "First Name";
    const lastName = personalInfo?.lastName || "Last Name";
    const jobTitle = personalInfo?.jobTitle || "";
    const email = personalInfo?.email || "";
    const phone = personalInfo?.phone || "";
    const phoneCode =
      personalInfo?.phoneCountryCode ||
      cvData.phoneCountryCode ||
      ""; // (NEW) phone code
    const city = personalInfo?.city || "";
    const country = personalInfo?.country || "";
    const summary = personalInfo?.summary || "";

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    let yPos = 20;
    const margin = 20;
    const pageWidth = 210 - margin * 2;
    const pageHeight = doc.internal.pageSize.getHeight();
    const bottomMargin = 20;

    const ensurePage = () => {
      if (yPos > pageHeight - bottomMargin) {
        doc.addPage();
        yPos = 20;
      }
    };

    // Color
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      if (!result) {
        return { r: 0, g: 0, b: 0 };
      }
      return {
        r: parseInt(result[1] || "00", 16),
        g: parseInt(result[2] || "00", 16),
        b: parseInt(result[3] || "00", 16),
      };
    };

    const color = hexToRgb(mainColor);

    // Simple HTML → text (paragraphs)
    const cleanHTML = (htmlText: string): string => {
      if (!htmlText) return "";
      if (!/[<][a-z][\s\S]*[>]/i.test(htmlText)) {
        return (htmlText || "").replace(/\u00A0/g, " ").trim();
      }
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = htmlText;

      let t = (tempDiv.innerText || "").replace(/\u00A0/g, " ");
      t = t.replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim();
      return t;
    };

    // HTML → <li> → tableau de strings
    const extractListItemsFromHTML = (htmlText: string): string[] => {
      if (!htmlText) return [];
      if (!/<li[\s>]/i.test(htmlText)) return [];

      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = htmlText;
      const liNodes = Array.from(tempDiv.querySelectorAll("li"));

      return liNodes
        .map((li) =>
          (li.textContent || "")
            .replace(/\u00A0/g, " ")
            .replace(/\s+/g, " ")
            .trim(),
        )
        .filter(Boolean);
    };

    // Texte normal (paragraphe) avec wrap
    const addWrappedText = (
      text: string,
      fontSize: number = 10,
      fontStyle: "normal" | "bold" | "italic" = "normal",
      textColor: [number, number, number] = [0, 0, 0],
      lineHeightFactor: number = 1.4,
    ) => {
      const cleanText = cleanHTML(text);
      if (!cleanText) return;

      doc.setFontSize(fontSize);
      doc.setFont("helvetica", fontStyle);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);

      const mmPerPt = 0.352777778;
      const lh = fontSize * lineHeightFactor * mmPerPt;
      const maxWidth = pageWidth;
      const paragraphs = cleanText.split(/\n{2,}/);

      paragraphs.forEach((para) => {
        const p = para.trim();
        if (!p) return;
        const wrapped = doc.splitTextToSize(p, maxWidth) as string[];
        wrapped.forEach((line) => {
          ensurePage();
          doc.text(line, margin, yPos);
          yPos += lh;
        });
        yPos += lh * 0.3;
      });
    };

    // Liste de bullets à partir d'un tableau (une ligne par item)
    const addBulletList = (
      items: string[],
      fontSize: number = 10,
      textColor: [number, number, number] = [40, 40, 40],
      lineHeightFactor: number = 1.4,
    ) => {
      if (!items || !items.length) return;

      doc.setFontSize(fontSize);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);

      const mmPerPt = 0.352777778;
      const lh = fontSize * lineHeightFactor * mmPerPt;

      const bulletX = margin;
      const textX = margin + 4;
      const maxWidth = pageWidth - (textX - margin);

      items.forEach((raw) => {
        const text = (raw || "").trim();
        if (!text) return;

        const wrapped = doc.splitTextToSize(text, maxWidth) as string[];

        ensurePage();
        doc.text("•", bulletX, yPos);
        doc.text(wrapped[0] || "", textX, yPos);
        yPos += lh;

        for (let i = 1; i < wrapped.length; i++) {
          ensurePage();
          doc.text(wrapped[i] || "", textX, yPos);
          yPos += lh;
        }

        yPos += lh * 0.2;
      });
    };

    // ----- HEADER -----
    const photoUrl =
      cvData.circularPhotoUrl ||
      cvData.photoUrl ||
      personalInfo?.photoUrl ||
      personalInfo?.photo;

    if (photoUrl && !cvData.displaySettings?.hidePhoto) {
      try {
        let imageData: string | null = null;

        if (photoUrl.startsWith("http") && !photoUrl.startsWith("data:")) {
          try {
            const isProd =
              typeof window !== "undefined" &&
              window.location.hostname.endsWith("brevy.me");
            const base = isProd ? "https://cvfolio.onrender.com" : "";
            const proxyUrl = `${base}/api/image-proxy?url=${encodeURIComponent(
              photoUrl,
            )}&circular=true`;

            const response = await fetch(proxyUrl);
            if (!response.ok) {
              throw new Error(
                `Proxy failed: ${response.status} ${response.statusText}`,
              );
            }

            const blob = await response.blob();
            const reader = new FileReader();
            imageData = await new Promise((resolve, reject) => {
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
          } catch {
            try {
              const response = await fetch(photoUrl);
              const blob = await response.blob();
              const reader = new FileReader();
              imageData = await new Promise((resolve, reject) => {
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              });
            } catch {
              imageData = null;
            }
          }
        } else {
          imageData = photoUrl;
        }

        if (imageData) {
          let imageFormat: "PNG" | "JPEG" = "JPEG";
          if (imageData.includes("data:image/png")) imageFormat = "PNG";
          const imgSize = 25;
          const imgX = margin;
          const imgY = yPos - 5;
          doc.addImage(imageData, imageFormat, imgX, imgY, imgSize, imgSize);
        }
      } catch {
        // ignore image errors
      }
    }

    const photoWidth = 25;
    const hasPhoto = photoUrl && !cvData.displaySettings?.hidePhoto;
    const textMargin = hasPhoto ? margin + photoWidth + 8 : margin;
    const textStartY = yPos;

    // Name
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(color.r, color.g, color.b);
    doc.text(`${firstName} ${lastName}`.toUpperCase(), textMargin, textStartY);

    // on descend un peu plus le bloc sous le nom pour mieux centrer
    let currentY = textStartY + 9; // name -> job title

    // Job title
    if (jobTitle) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);
      doc.text(jobTitle, textMargin, currentY);
      currentY += 8; // un peu plus d'espace
    }

    // Contact
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);

    let locationStr = "";
    if (city && country) locationStr = `${city}, ${country}`;
    else if (city) locationStr = city;
    else if (country) locationStr = country;

    const phoneDisplay = phone
      ? `${phoneCode ? `(${phoneCode}) ` : ""}${phone}` // (NEW) code pays entre parenthèses
      : "";

    const contactParts = [email, phoneDisplay, locationStr].filter(Boolean);
    const contactInfo = contactParts.join(" | ");

    if (contactInfo) {
      doc.text(contactInfo, textMargin, currentY);
      currentY += 9; // on descend un peu plus pour respirer
    }

    // CV Online URL (if published)
    if (subdomain) {
      const isProd = typeof window !== 'undefined' && window.location.hostname.endsWith('brevy.me');
      const baseUrl = isProd ? 'https://brevy.me' : 'http://localhost:10000';
      const cvUrl = `${baseUrl}/shared/${subdomain}`;
      doc.setFontSize(9);
      doc.setTextColor(color.r, color.g, color.b);
      
      // Calculate text width for the link area
      const textWidth = doc.getTextWidth(cvUrl);
      const textHeight = 5; // Approximate height for link area
      
      // Add text
      doc.text(cvUrl, textMargin, currentY);
      
      // Add clickable link (link area: x, y, width, height, options)
      // y position needs to be adjusted: jsPDF uses bottom-left origin, so we subtract the height
      doc.link(textMargin, currentY - textHeight, textWidth, textHeight, { url: cvUrl });
      
      currentY += 6; // Small spacing after URL
    }

    yPos = currentY + 4;

    // Separator line
    doc.setDrawColor(color.r, color.g, color.b);
    doc.setLineWidth(0.4);
    doc.line(margin, yPos, margin + pageWidth, yPos);
    yPos += 8;

    // ----- SECTION HELPERS -----
    const addSectionTitle = (title: string) => {
      if (!title) return;
      ensurePage();
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(color.r, color.g, color.b);
      doc.text(title.toUpperCase(), margin, yPos);
      yPos += 5;
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(margin, yPos, margin + pageWidth, yPos);
      yPos += 5;
    };

    const formatMonthName = (month: string | number): string => {
      const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      const m = typeof month === "string" ? parseInt(month, 10) : month;
      return months[m - 1] || "";
    };

    // ----- PROFILE -----
    if (summary) {
      addSectionTitle(titles.profile);
      addWrappedText(summary, 10, "italic", [60, 60, 60]);
      yPos += 2;
    }

    // ----- EXPERIENCE -----
    const experiences = cvData.experience || [];
    if (experiences.length > 0) {
      addSectionTitle(titles.experience);

      experiences.forEach((exp: any) => {
        ensurePage();
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text(exp.title || exp.position || "", margin, yPos);
        yPos += 5;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(color.r, color.g, color.b);
        let companyText = exp.company || "";
        if (exp.location) {
          companyText += ` | ${exp.location}`;
        }
        if (companyText) {
          doc.text(companyText, margin, yPos);
          yPos += 5;
        }

        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);

        let startDate = "";
        if (exp.from) {
          if (exp.from.includes("/")) {
            const [month, year] = exp.from.split("/");
            startDate = `${formatMonthName(month)} ${year}`;
          } else if (exp.from.includes("-")) {
            const [year, month] = exp.from.split("-");
            startDate = `${formatMonthName(month)} ${year}`;
          } else {
            startDate = exp.from;
          }
        }

        let endDate = "";
        if (exp.current || exp.isCurrent) {
          endDate = "Present";
        } else if (exp.to) {
          if (exp.to.includes("/")) {
            const [month, year] = exp.to.split("/");
            endDate = `${formatMonthName(month)} ${year}`;
          } else if (exp.to.includes("-")) {
            const [year, month] = exp.to.split("-");
            endDate = `${formatMonthName(month)} ${year}`;
          } else {
            endDate = exp.to;
          }
        }

        if (startDate || endDate) {
          const dates = `${startDate} – ${endDate || "Present"}`;
          doc.text(dates, margin, yPos);
          yPos += 5;
        }

        const expDescriptionHTML = exp.description || exp.summary || "";
        if (expDescriptionHTML) {
          const items = extractListItemsFromHTML(expDescriptionHTML);
          if (items.length > 0) {
            yPos += 1;
            addBulletList(items, 9, [60, 60, 60]);
          } else {
            yPos += 1;
            addWrappedText(expDescriptionHTML, 9, "normal", [60, 60, 60]);
          }
        }

        yPos += 3;
      });
    }

    // ----- EDUCATION -----
    const education = cvData.education || [];
    if (education.length > 0) {
      addSectionTitle(titles.education);

      education.forEach((edu: any) => {
        ensurePage();
        const diplomaName =
          edu.diploma || edu.degree || edu.title || edu.name || "";
        if (diplomaName) {
          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(0, 0, 0);
          doc.text(diplomaName, margin, yPos);
          yPos += 5;
        }

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(color.r, color.g, color.b);
        let schoolText = edu.school || edu.institution || "";
        if (edu.location) {
          schoolText += ` | ${edu.location}`;
        }
        if (schoolText) {
          doc.text(schoolText, margin, yPos);
          yPos += 5;
        }

        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);

        let startDate = "";
        if (edu.from) {
          if (edu.from.includes("/")) {
            const [month, year] = edu.from.split("/");
            startDate = `${formatMonthName(month)} ${year}`;
          } else if (edu.from.includes("-")) {
            const [year, month] = edu.from.split("-");
            startDate = `${formatMonthName(month)} ${year}`;
          } else {
            startDate = edu.from;
          }
        }

        let endDate = "";
        if (edu.to) {
          if (edu.to.includes("/")) {
            const [month, year] = edu.to.split("/");
            endDate = `${formatMonthName(month)} ${year}`;
          } else if (edu.to.includes("-")) {
            const [year, month] = edu.to.split("-");
            endDate = `${formatMonthName(month)} ${year}`;
          } else {
            endDate = edu.to;
          }
        }

        if (startDate || endDate) {
          const dates = `${startDate} – ${endDate || ""}`;
          doc.text(dates, margin, yPos);
          yPos += 5;
        }

        if (edu.description) {
          const items = extractListItemsFromHTML(edu.description);
          if (items.length > 0) {
            yPos += 1;
            addBulletList(items, 9, [60, 60, 60]);
          } else {
            yPos += 1;
            addWrappedText(edu.description, 9, "normal", [60, 60, 60]);
          }
        }

        yPos += 3;
      });
    }

    // ----- SKILLS & TOOLS -----
    const skills = cvData.skills || [];
    const tools = cvData.tools || [];

    if (skills.length > 0 || tools.length > 0) {
      addSectionTitle(titles.skills);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(40, 40, 40);

      // --- Skills block ---
      if (skills.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.text("Skills", margin, yPos);
        yPos += 5;

        doc.setFont("helvetica", "normal");
        const skillsText = skills
          .map((s: any) => s.name || s)
          .filter(Boolean)
          .join(" | ");

        if (skillsText) {
          const wrapped = doc.splitTextToSize(skillsText, pageWidth) as string[];
          wrapped.forEach((line) => {
            ensurePage();
            doc.text(line, margin, yPos);
            yPos += 5;
          });
          yPos += 3;
        }
      }

      // --- Tools block ---
      if (tools.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.text("Tools", margin, yPos);
        yPos += 5;

        doc.setFont("helvetica", "normal");
        const toolsText = tools
          .map((t: any) => t.name || t)
          .filter(Boolean)
          .join(" | ");

        if (toolsText) {
          const wrapped = doc.splitTextToSize(toolsText, pageWidth) as string[];
          wrapped.forEach((line) => {
            ensurePage();
            doc.text(line, margin, yPos);
            yPos += 5;
          });
          yPos += 2;
        }
      }
    }


    // ----- LANGUAGES -----
    const languagesData = cvData.languages || [];
    if (languagesData.length > 0) {
      addSectionTitle(titles.languages);

      const levelMap = {
        en: {
          native: "Native or Bilingual Proficiency",
          fluent: "Full Professional Proficiency",
          advanced: "Full Professional Proficiency",
          intermediate: "Limited Working Proficiency",
          beginner: "Elementary Proficiency",
          elementary: "Elementary Proficiency",
        },
        fr: {
          native: "Langue maternelle ou bilingue",
          fluent: "Compétence professionnelle complète",
          advanced: "Compétence professionnelle complète",
          intermediate: "Compétence professionnelle limitée",
          beginner: "Notions de base",
          elementary: "Notions de base",
        },
      };

      const getLevelLabel = (level: string): string => {
        const key = (level || "").toLowerCase() as keyof (typeof levelMap)["en"];
        return levelMap[language][key] || level || "";
      };

      const languageItems = languagesData.map((lang: any) => {
        const name = lang.name || lang;
        const levelLabel = lang.level ? ` (${getLevelLabel(lang.level)})` : "";
        return `${name}${levelLabel}`;
      });

      addBulletList(languageItems, 10, [40, 40, 40]);
      yPos += 2;
    }

    // ----- CERTIFICATIONS -----
    const certifications = cvData.certifications || [];
    if (certifications.length > 0) {
      addSectionTitle(titles.certifications);

      const certItems = certifications.map((cert: any) => {
        const parts: string[] = [];
        if (cert.name) parts.push(cert.name);
        if (cert.issuer) parts.push(cert.issuer);
        if (cert.date) parts.push(cert.date);
        return parts.join(" – ");
      });

      addBulletList(certItems, 10, [40, 40, 40]);
      yPos += 2;
    }

    // Save
    doc.save(`CV_${firstName}_${lastName}.pdf`);
  } catch (error) {
    console.error("Detailed error:", error);
    throw new Error(
      `Erreur PDF: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
}
