import React, { useState, useEffect } from "react";
import "./styles/template-boxes.css";
import {
  getLanguageLevelLabel,
  normalizeLanguageLevel,
} from "../language-levels";
import { renderHTMLContent } from "../html-renderer";
import { formatPhoneDisplay } from "../cv-helpers";
import { CVFooter } from "@/components/shared/cv-footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTemplateData } from "@/lib/hooks/useTemplateData";
import { TemplateProps } from "./index";
import { imagePreloader } from "@/lib/image-preloader";
import * as Icons from "@/lib/icons";

export const TemplateBoxes: React.FC<TemplateProps> = ({
  data,
  mainColor,
  hidePhoto = false,
  hideCity = false,
  hideSkillLevels = false,
  hideToolLevels = false,
  hideLanguageLevels = false,
  hideLinkedIn = false,
  hideWebsite = false,
  showBrevyLink = false,
  isPreview = false,
  hasSubscription = false,
  isPublished = false,
  isMobile = false,
  onContactClick,
}) => {
  const { t, language } = useLanguage();
  const [activeSection, setActiveSection] = useState<string>("experience");
  // Use the isMobile prop directly
  const {
    data: enrichedData,
    getValueWithDefault,
    defaultData,
    isSectionEmpty,
    isPersonalFieldEmpty,
  } = useTemplateData(data, isPublished);

  // Mobile detection is now handled by the parent component via isMobile prop

  // Mettre à jour la couleur principale dans les variables CSS
  useEffect(() => {

    // Appliquer directement à la racine du document pour simplifier
    document.documentElement.style.setProperty("--mainColor", mainColor);

    // Sélectionner tous les éléments avec la classe .template-2 et appliquer la variable
    const templateElements = document.querySelectorAll(".template-boxes");
    templateElements.forEach((element) => {
      (element as HTMLElement).style.setProperty("--mainColor", mainColor);
    });
  }, [mainColor]);

  // Format de date helper adapté au format de l'application
  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return "";

    // Gérer les deux formats possibles: "MM/YYYY" ou "YYYY-MM"
    let month, year;

    if (dateStr.includes("/")) {
      [month, year] = dateStr.split("/");
    } else if (dateStr.includes("-")) {
      [year, month] = dateStr.split("-");
    } else {
      return dateStr; // Si le format est inconnu, retourner tel quel
    }

    const months = [
      t("templates.months.jan"),
      t("templates.months.feb"),
      t("templates.months.mar"),
      t("templates.months.apr"),
      t("templates.months.may"),
      t("templates.months.jun"),
      t("templates.months.jul"),
      t("templates.months.aug"),
      t("templates.months.sep"),
      t("templates.months.oct"),
      t("templates.months.nov"),
      t("templates.months.dec"),
    ];
    const monthIndex = parseInt(month) - 1;

    if (isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) {
      return dateStr || "";
    }

    return `${months[monthIndex]} ${year}`;
  };

  // Gérer le changement d'onglet
  const handleTabChange = (section: string) => {
    setActiveSection(section);
  };

  return (
    <div className="template-boxes template-container relative">
      <div className="resume-container">
        <div className="col col-left">
          <div className="profile-section">
            <div className="profile-section-header" />
            {!hidePhoto && (!isPublished || (data.personalInfo?.photoUrl && data.personalInfo?.photoUrl.trim() !== '') || (data.personalInfo?.photo && data.personalInfo?.photo.trim() !== '')) && (
              <div className="profile-pic">
                <img
                  src={
                    (data.personalInfo?.photoUrl &&
                      data.personalInfo?.photoUrl !== "") ||
                    (data.personalInfo?.photo && data.personalInfo?.photo !== "")
                      ? data.personalInfo?.photoUrl || data.personalInfo?.photo
                      : imagePreloader.getImageSrc("2")
                  }
                  alt={`${data.personalInfo?.firstName || ""} ${data.personalInfo?.lastName || ""}`}
                  loading="eager"
                  decoding="sync"
                />
              </div>
            )}

            <div className={`profile-infos ${hidePhoto ? "no-photo" : ""}`}>
              <div className="top-infos">
                <h1 className="name">
                  {data.personalInfo?.firstName || enrichedData.personalInfo.firstName}{" "}
                  {data.personalInfo?.lastName || enrichedData.personalInfo.lastName}
                </h1>
                <h2 className="role">{data.personalInfo?.jobTitle || enrichedData.personalInfo.jobTitle}</h2>
                {((data.personalInfo?.city || enrichedData.personalInfo?.city) ||
                  (data.personalInfo?.country || enrichedData.personalInfo?.country)) && (
                  <span className="personal-location">
                    <Icons.HiOutlineMapPin size={16} />
                    {!hideCity && (data.personalInfo?.city || enrichedData.personalInfo.city)
                      ? (data.personalInfo?.city || enrichedData.personalInfo.city)
                      : ""}
                    {(data.personalInfo?.country || enrichedData.personalInfo?.country) &&
                    !hideCity &&
                    (data.personalInfo?.city || enrichedData.personalInfo.city)
                      ? ", "
                      : ""}
                    {(data.personalInfo?.country || enrichedData.personalInfo?.country)
                      ? (data.personalInfo?.country || enrichedData.personalInfo.country)
                      : ""}
                  </span>
                )}
              </div>
              <div className="contact-section">
                {/* Téléphone */}
                <a
                  href={
                    enrichedData.personalInfo.phone?.trim()
                      ? `tel:${enrichedData.personalInfo.phone}`
                      : "#"
                  }
                  className="contact-item"
                  onClick={(e) => {
                    if (!enrichedData.personalInfo.phone || enrichedData.personalInfo.phone.trim() === '' || enrichedData.personalInfo.phone === defaultData.personalInfo.phone) {
                      e.preventDefault();
                      onContactClick?.('phone');
                    }
                  }}
                >
                    <div className="contact-icon">
                      <svg viewBox="0 0 16 16" fill="none">
                        <g>
                          <path
                            className="cls-1"
                            d="M14.4,10.4c-.2-.2-.5-.4-.8-.5-.6,0-1.3-.2-1.9-.5-.2,0-.5-.1-.7,0-.2,0-.5.2-.7.4l-.8.8c-1.7-.9-3.1-2.3-4-4l.8-.8c.2-.2.3-.4.4-.7,0-.2,0-.5,0-.7-.2-.6-.4-1.2-.5-1.9,0-.3-.2-.6-.5-.8-.2-.2-.6-.3-.9-.3h-2c-.2,0-.4,0-.5.1-.2,0-.3.2-.4.3-.1.1-.2.3-.3.5s0,.4,0,.5c.2,2.1.9,4,2,5.8,1,1.6,2.4,3,4,4,1.7,1.1,3.7,1.8,5.8,2,.2,0,.4,0,.5,0,.2,0,.3-.2.5-.3.1-.1.2-.3.3-.4,0-.2.1-.4.1-.5v-2c0-.3-.1-.6-.3-.9Z"
                            fill="currentColor"
                          />
                        </g>
                      </svg>
                    </div>
                    <div className="contact-item-link">
                      <span>
                        {formatPhoneDisplay(
                          enrichedData.personalInfo?.phone,
                          enrichedData.phoneCountryCode,
                        )}
                      </span>
                      <Icons.HiOutlineChevronRight size={16} />
                    </div>
                  </a>

                {/* Email */}
                <a
                  href={
                    data.personalInfo?.email?.trim()
                      ? `https://mail.google.com/mail/?view=cm&fs=1&to=${data.personalInfo?.email}`
                      : "#"
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-item"
                  onClick={(e) => {
                    if (!data.personalInfo?.email || data.personalInfo?.email.trim() === '' || data.personalInfo?.email === defaultData.personalInfo.email) {
                      e.preventDefault();
                      onContactClick?.('email');
                    }
                  }}
                >
                    <div className="contact-icon">
                      <svg viewBox="0 0 16 16" fill="none">
                        <g>
                          <path
                            className="cls-1"
                            d="M1.4,3.6l5.8,3.5c.2.1.5.2.7.2.3,0,.5,0,.7-.2.2-.1,5.5-3.3,5.8-3.5.4-.2.7-1.1,0-1.1H1.4c-.7,0-.3.9,0,1.1Z"
                            fill="currentColor"
                          />
                          <path
                            className="cls-1"
                            d="M14.7,5.6l-6,3.5c-.3.2-.4.2-.7.2-.2,0-.5,0-.7-.2L1.3,5.6c-.3-.2-.3,0-.3.2v6.9c0,.4.4.9.8.9h12.4c.3,0,.8-.5.8-.9v-6.9c0-.2,0-.4-.3-.2Z"
                            fill="currentColor"
                          />
                        </g>
                      </svg>
                    </div>
                    <div className="contact-item-link">
                      <span>{t("templates.contacts.sendEmail")}</span>
                      <Icons.HiOutlineArrowTopRightOnSquare size={16} />
                    </div>
                  </a>

                {/* LinkedIn */}
                {!hideLinkedIn && (
                  <a
                    href={
                      data.personalInfo?.linkedin?.trim()
                        ? data.personalInfo?.linkedin.startsWith("http")
                          ? data.personalInfo?.linkedin
                          : `https://www.linkedin.com/in/${data.personalInfo?.linkedin}`
                        : "#"
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="contact-item"
                    onClick={(e) => {
                      if (!data.personalInfo?.linkedin || data.personalInfo?.linkedin.trim() === '' || data.personalInfo?.linkedin === defaultData.personalInfo.linkedin) {
                        e.preventDefault();
                        onContactClick?.('linkedin');
                      }
                    }}
                  >
                    <div className="contact-icon">
                      <svg viewBox="0 0 16 16" fill="none">
                        <g>
                          <rect
                            className="cls-1"
                            x="2.2"
                            y="6"
                            width="2.5"
                            height="8"
                            fill="currentColor"
                          />
                          <path
                            className="cls-1"
                            d="M11,5.8c-1.2,0-2,.7-2.4,1.3h0v-1.1h-2.4v8h2.5v-4c0-1,.2-2.1,1.5-2.1s1.3,1.2,1.3,2.1v3.9h2.5v-4.4c0-2.2-.5-3.8-3-3.8Z"
                            fill="currentColor"
                          />
                          <path
                            className="cls-1"
                            d="M3.4,2c-.8,0-1.4.6-1.4,1.4s.6,1.4,1.4,1.4,1.4-.6,1.4-1.4-.6-1.4-1.4-1.4Z"
                            fill="currentColor"
                          />
                        </g>
                      </svg>
                    </div>
                    <div className="contact-item-link">
                      <span>{t("templates.contacts.viewLinkedin")}</span>
                      <Icons.HiOutlineArrowTopRightOnSquare size={16} />
                    </div>
                  </a>
                )}

                {/* Site web */}
                {!hideWebsite && (
                  <a
                    href={
                      data.personalInfo?.website?.trim()
                        ? data.personalInfo?.website.startsWith("http")
                          ? data.personalInfo?.website
                          : `https://${data.personalInfo?.website}`
                        : "#"
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="contact-item"
                    onClick={(e) => {
                      if (!data.personalInfo?.website || data.personalInfo?.website.trim() === '' || data.personalInfo?.website === defaultData.personalInfo.website) {
                        e.preventDefault();
                        onContactClick?.('website');
                      }
                    }}
                  >
                    <div className="contact-icon">
                      <svg viewBox="0 0 16 16" fill="none">
                        <g>
                          <path
                            className="cls-1"
                            d="M8.4,1h-.4c-3.9,0-7,3.1-7,7v.4c.2,3.6,3.1,6.5,6.6,6.6h.4c3.7,0,6.8-2.9,7-6.6v-.4c0-3.7-2.9-6.8-6.6-7ZM8,13c-2.8,0-5-2.2-5-5s0,0,0,0c0,2.8,2.2,5,5,5h0ZM8,13v-1.7l-.8-1.3h-1.3v-1.3l-1.3-.8h-1.7c0-2.8,2.2-5,5-5s.3,0,.4,0v1.6l-2.1.8v1.3l1.3,1.3h1.7l.4.4.4.8h1.3v-1.3l1.6-.3c0,.1,0,.2,0,.3,0,2.8-2.2,5-5,5Z"
                            fill="currentColor"
                          />
                        </g>
                      </svg>
                    </div>
                    <div className="contact-item-link">
                      <span>View my website</span>
                      <Icons.HiOutlineArrowTopRightOnSquare size={16} />
                    </div>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Mobile: duplicate summary after profile and before main content
              Always render; visibility controlled by CSS container queries */}
          {data.personalInfo?.summary && (
            <div className="summary-section-mobile">
              {renderHTMLContent(data.personalInfo?.summary)}
            </div>
          )}
        </div>

        {/* Deuxième colonne - Résum �, compétences, langues et centres d'intérêt */}
        <div className="col col-center">
          {/* Résumé */}
          {data.personalInfo?.summary && (
            <div className="summary-section">
              {renderHTMLContent(data.personalInfo?.summary)}
            </div>
          )}

          {/* Compétences */}
          {data.skills && data.skills.length > 0 && (
            <div className="skills-section">
              <h3 className="section-title">{t("templates.sections.skills")}</h3>
              <div className="section-content">
                {hideSkillLevels ? (
                  <div className="skills-horizontal">
                    {data.skills.map((skill) => (
                      <span key={skill.id} className="skill-name-only">
                        {skill.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  data.skills.map((skill) => (
                    <div key={skill.id} className="skill-item">
                      <span className="skill-name">{skill.name}</span>
                      {skill.showLevel !== false && (
                        <div className="skill-bar">
                          <div
                            className="skill-level"
                            style={{
                              width:
                                skill.level === "beginner"
                                  ? "25%"
                                  : skill.level === "medium"
                                    ? "50%"
                                    : skill.level === "advanced"
                                      ? "75%"
                                      : skill.level === "expert"
                                        ? "100%"
                                        : "50%",
                              backgroundColor: mainColor,
                            }}
                          ></div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Outils */}
              {data.tools && data.tools.length > 0 && (
                <>
                  <h3
                    className="section-title tools-title"
                    style={{ paddingTop: "0" }}
                  >
                    Tools
                  </h3>
                  <div className="section-content">
                    {hideToolLevels ? (
                      <div className="skills-horizontal">
                        {data.tools.map((tool) => (
                          <span key={tool.id} className="skill-name-only">
                            {tool.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      data.tools.map((tool) => (
                        <div key={tool.id} className="skill-item">
                          <span className="skill-name">{tool.name}</span>
                          {tool.showLevel !== false && (
                            <div className="skill-bar">
                              <div
                                className="skill-level"
                                style={{
                                  width:
                                    tool.level === "beginner"
                                      ? "25%"
                                      : tool.level === "medium"
                                        ? "50%"
                                        : tool.level === "advanced"
                                          ? "75%"
                                          : tool.level === "expert"
                                            ? "100%"
                                            : "50%",
                                  backgroundColor: mainColor,
                                }}
                              ></div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Langues */}
          {data.languages && data.languages.length > 0 && (
            <div className="languages-section">
              <h3 className="section-title">
                {t("cvBuilder.templates.sections.languages")}
              </h3>
              <div className="section-content">
                <div className="languages-list">
                  {data.languages.map((lang) => (
                    <div key={lang.id} className="language-item">
                      <span className="language-name">{lang.name}</span>
                      <span className="language-level">
                        {getLanguageLevelLabel(
                          normalizeLanguageLevel(lang.level || "beginner"),
                          language
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Centres d'intérêt */}
          {data.hobbies && data.hobbies.length > 0 && (
            <div className="interests-section">
              <h3 className="section-title">
                {t("cvBuilder.templates.sections.hobbies")}
              </h3>
              <div className="section-content">
                <div className="interests-list">
                  {data.hobbies.map((hobby) => (
                    <div key={hobby.id} className="interest-item">
                      {hobby.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Troisième colonne - Contenu principal avec onglets */}
        <div className="col col-right main-content">
          {/* Navigation par onglets */}
          <div className="nav-tabs">
            <div
              className={`nav-item ${activeSection === "experience" ? "active" : ""}`}
              onClick={() => handleTabChange("experience")}
            >
              {t("cvBuilder.templates.sections.experience")}
            </div>
            <div
              className={`nav-item ${activeSection === "education" ? "active" : ""}`}
              onClick={() => handleTabChange("education")}
            >
              {t("cvBuilder.templates.sections.education")}
            </div>
            {data.certifications && data.certifications.length > 0 && (
              <div
                className={`nav-item ${activeSection === "certifications" ? "active" : ""}`}
                onClick={() => handleTabChange("certifications")}
              >
                {t("cvBuilder.templates.sections.certifications")}
              </div>
            )}
          </div>

          {/* Contenu principal avec sections */}
          <div className="content">
            {/* Section Expérience */}
            <div
              id="experience"
              className={`timeline-section ${activeSection === "experience" ? "active" : ""}`}
            >
              <h2 className="content-title mobile-only-title">
                {t("cvBuilder.templates.sections.experience")}
              </h2>
              <div className="timeline">
                {data.experience &&
                  data.experience.length > 0 &&
                  data.experience.map((exp) => (
                    <div key={exp.id} className="timeline-item">
                      <div
                        className="timeline-date"
                        style={{ color: mainColor }}
                      >
                        <span className="date-start">
                          {formatDate(
                            exp.from ||
                              (exp.startMonth && exp.startYear
                                ? `${exp.startMonth}/${exp.startYear}`
                                : ""),
                          )}
                        </span>
                        <span
                          className="date-separator"
                          style={{ backgroundColor: mainColor }}
                        ></span>
                        <span className="date-end">
                          {exp.current || exp.isCurrent
                            ? "Présent"
                            : formatDate(
                                exp.to ||
                                  (exp.endMonth && exp.endYear
                                    ? `${exp.endMonth}/${exp.endYear}`
                                    : ""),
                              )}
                        </span>
                      </div>
                      <div className="timeline-indicator">
                        <div
                          className="timeline-dot"
                          style={{ backgroundColor: mainColor }}
                        />
                        <div
                          className="timeline-line"
                          style={{ backgroundColor: mainColor }}
                        />
                      </div>
                      <div className="timeline-content">
                        <h3 className="timeline-title">{exp.position}</h3>
                        <div className="orginfo">
                          <div className="timeline-company placename">
                            <Icons.HiOutlineBuildingOffice2 size={16} />
                            {exp.company}
                          </div>
                          <div className="timeline-location location">
                            <Icons.HiOutlineMapPin size={16} />
                            {exp.location}
                          </div>
                        </div>
                        {(exp.summary || exp.description) && (
                          <div className="timeline-details">
                            {renderHTMLContent(
                              exp.summary || exp.description || "",
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Section Formation */}
            <div
              id="education"
              className={`timeline-section ${activeSection === "education" ? "active" : ""}`}
            >
              <h2 className="content-title mobile-only-title">Formation</h2>
              <div className="timeline">
                {data.education &&
                  data.education.length > 0 &&
                  data.education.map((edu) => (
                    <div key={edu.id} className="timeline-item">
                      <div
                        className="timeline-date"
                        style={{ color: mainColor }}
                      >
                        <span className="date-start">
                          {formatDate(
                            edu.from ||
                              (edu.startMonth && edu.startYear
                                ? `${edu.startMonth}/${edu.startYear}`
                                : ""),
                          )}
                        </span>
                        <span
                          className="date-separator"
                          style={{ backgroundColor: mainColor }}
                        ></span>
                        <span className="date-end">
                          {formatDate(
                            edu.to ||
                              (edu.endMonth && edu.endYear
                                ? `${edu.endMonth}/${edu.endYear}`
                                : ""),
                          )}
                        </span>
                      </div>
                      <div className="timeline-indicator">
                        <div
                          className="timeline-dot"
                          style={{ backgroundColor: mainColor }}
                        />
                        <div
                          className="timeline-line"
                          style={{ backgroundColor: mainColor }}
                        />
                      </div>
                      <div className="timeline-content">
                        <h3 className="timeline-title">
                          {edu.diploma || t("templates.fields.degree")}
                        </h3>
                        <div className="orginfo">
                          {edu.school && (
                            <div className="timeline-company placename">
                              <Icons.HiOutlineBuildingOffice2 size={16} />
                              {edu.school}
                            </div>
                          )}
                          {edu.location && (
                            <div className="timeline-location location">
                              <Icons.HiOutlineMapPin size={16} />
                              {edu.location}
                            </div>
                          )}
                        </div>
                        <div className="timeline-details">
                          {edu.description ? (
                            renderHTMLContent(edu.description)
                          ) : (
                            <p>
                              Comprehensive education in the field of study.
                              Acquisition of theoretical and practical skills.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Section Certifications */}
            {data.certifications && data.certifications.length > 0 && (
              <div
                id="certifications"
                className={`timeline-section ${activeSection === "certifications" ? "active" : ""}`}
              >
                <h2 className="content-title mobile-only-title">
                  {t("cvBuilder.templates.sections.certifications")}
                </h2>
                <div className="timeline">
                  {data.certifications.map((cert) => (
                    <div key={cert.id} className="timeline-item">
                      <div
                        className="timeline-date"
                        style={{ color: mainColor }}
                      >
                        <span className="date-start">
                          {formatDate(cert.date)}
                        </span>
                      </div>
                      <div className="timeline-indicator">
                        <div
                          className="timeline-dot"
                          style={{ backgroundColor: mainColor }}
                        />
                        <div
                          className="timeline-line"
                          style={{ backgroundColor: mainColor }}
                        />
                      </div>
                      <div className="timeline-content">
                        <h3 className="timeline-title">{cert.name}</h3>
                        <div className="orginfo">
                          <div className="placename">{cert.issuer}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer unifié avec PDF et Brevy */}
      <CVFooter
        cvData={data}
        templateId="template-boxes"
        mainColor={mainColor}
        showBrevyLink={true}
        isPreview={isPreview}
        hasSubscription={hasSubscription}
        isPublished={isPublished}
        className="cv-footer-template"
      />
    </div>
  );
};

export default TemplateBoxes;
