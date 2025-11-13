import React, { useState, useEffect } from "react";
import { Phone, Mail, Linkedin } from "lucide-react";
import "./styles/template-landing.css";
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

export const TemplateLanding: React.FC<TemplateProps> = ({
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
  onContactClick,
}) => {
  const { t, language } = useLanguage();
  const [activeSection, setActiveSection] = useState<string>("experience");
  const {
    data: enrichedData,
    getValueWithDefault,
    defaultData,
    isSectionEmpty,
    isPersonalFieldEmpty,
  } = useTemplateData(data, isPublished);

  // Mettre à jour la couleur principale dans les variables CSS
  useEffect(() => {

    // Appliquer directement à la racine du document pour simplifier
    document.documentElement.style.setProperty("--mainColor", mainColor);

    // Sélectionner tous les éléments avec la classe .template-6 et appliquer la variable
    const templateElements = document.querySelectorAll(".template-landing");
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

  const handleTabChange = (section: string) => {
    setActiveSection(section);
  };

  const getGmailComposeHref = (email?: string) => {
    if (!email) return "#";
    const to = encodeURIComponent(email);
    return `https://mail.google.com/mail/?view=cm&fs=1&to=${to}`;
  };

  return (
    <div className="template-landing template-container relative">
      <div className="resume-container">
        <div className="header-section">
          <div className="header-background">
            <div className="circle circle-1"></div>

            {/* Icônes de contact en haut à droite */}
            <div className="header-contact-icons">
              <a
                href={`tel:${data.personalInfo?.phone}`}
                className="header-icon"
                onClick={(e) => {
                  if (!data.personalInfo?.phone || data.personalInfo?.phone.trim() === '' || data.personalInfo?.phone === defaultData.personalInfo.phone) {
                    e.preventDefault();
                    onContactClick?.('phone');
                  }
                }}
              >
                  <Phone size={20} />
                </a>
              <a
                href={getGmailComposeHref(data.personalInfo?.email)}
                target="_blank"
                rel="noopener noreferrer"
                className="header-icon"
                onClick={(e) => {
                  if (!data.personalInfo?.email || data.personalInfo?.email.trim() === '' || data.personalInfo?.email === defaultData.personalInfo.email) {
                    e.preventDefault();
                    onContactClick?.('email');
                  }
                }}
              >
                  <Mail size={20} />
                </a>

              {!hideLinkedIn && (
              <a
                href={
                  data.personalInfo?.linkedin.startsWith("http")
                    ? data.personalInfo?.linkedin
                    : `https://www.linkedin.com/in/${data.personalInfo?.linkedin}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="header-icon"
                onClick={(e) => {
                  if (!data.personalInfo?.linkedin || data.personalInfo?.linkedin.trim() === '' || data.personalInfo?.linkedin === defaultData.personalInfo.linkedin) {
                    e.preventDefault();
                    onContactClick?.('linkedin');
                  }
                }}
              >
                  <Linkedin size={20} />
                </a>
              )}

              {/* Website Link */}
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
                  className="header-icon"
                  onClick={(e) => {
                    if (!data.personalInfo?.website || data.personalInfo?.website.trim() === '' || data.personalInfo?.website === defaultData.personalInfo.website) {
                      e.preventDefault();
                      onContactClick?.('website');
                    }
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                    <g>
                      <path
                        d="M8 0C3.58 0 0 3.58 0 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"
                        fill="currentColor"
                      />
                      <path
                        d="M8 2C4.69 2 2 4.69 2 8s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"
                        fill="currentColor"
                      />
                      <path
                        d="M8 4c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"
                        fill="currentColor"
                      />
                    </g>
                  </svg>
                </a>
              )}

            </div>

            {/* Informations principales du profil - Layout 5 colonnes */}
            <div className="profile-main-info">
              {/* Colonne 1-2 : Nom et ville */}
              <div className="profile-name-location">
                <h1 className="name">
                  {getValueWithDefault(
                    data.personalInfo?.firstName,
                    defaultData.personalInfo.firstName,
                  )}{" "}
                  {getValueWithDefault(
                    data.personalInfo?.lastName,
                    defaultData.personalInfo.lastName,
                  )}
                </h1>
                {(data.personalInfo?.city || data.personalInfo?.country) && (
                  <div className="location">
                    <Icons.HiOutlineMapPin size={16} />
                    <span>
                      {!hideCity && data.personalInfo?.city
                        ? data.personalInfo?.city
                        : ""}
                      {data.personalInfo?.country &&
                      !hideCity &&
                      data.personalInfo?.city
                        ? ", "
                        : ""}
                      {data.personalInfo?.country
                        ? data.personalInfo?.country
                        : ""}
                    </span>
                  </div>
                )}
              </div>

              {/* Column 3: Profile photo */}
              {!hidePhoto && (!isPublished || (data.personalInfo?.photoUrl && data.personalInfo?.photoUrl.trim() !== '') || (data.personalInfo?.photo && data.personalInfo?.photo.trim() !== '')) && (
                <div className="profile-photo">
                  <img
                    src={
                      (data.personalInfo?.photoUrl &&
                        data.personalInfo?.photoUrl !== "") ||
                      (data.personalInfo?.photo &&
                        data.personalInfo?.photo !== "")
                        ? data.personalInfo?.photoUrl ||
                          data.personalInfo?.photo
                        : imagePreloader.getImageSrc("6")
                    }
                    alt={`${data.personalInfo?.firstName || ""} ${data.personalInfo?.lastName || ""}`}
                    loading="eager"
                    decoding="sync"
                  />
                </div>
              )}

              {/* Column 4-5: Position and summary */}
              <div className="profile-position-summary">
                <h2 className="position">
                  {getValueWithDefault(
                    data.personalInfo?.position || data.personalInfo?.jobTitle,
                    defaultData.personalInfo.jobTitle,
                  )}
                </h2>

                {data.personalInfo?.summary && (
                  <div className="summary">
                    {renderHTMLContent(data.personalInfo?.summary)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation par onglets - Hidden on mobile */}
        <div className="nav-tabs-container desktop-only">
          <div className="nav-tabs">
            {data.experience && data.experience.length > 0 && (
              <button
                className={`nav-item ${activeSection === "experience" ? "active" : ""}`}
                onClick={() => handleTabChange("experience")}
              >
                <Icons.HiOutlineBriefcase size={20} />
{t("templates.sections.experience")}
              </button>
            )}
            {data.education && data.education.length > 0 && (
              <button
                className={`nav-item ${activeSection === "education" ? "active" : ""}`}
                onClick={() => handleTabChange("education")}
              >
                <Icons.HiOutlineAcademicCap size={20} />
{t("templates.sections.education")}
              </button>
            )}
            {data.certifications && data.certifications.length > 0 && (
              <button
                className={`nav-item ${activeSection === "certifications" ? "active" : ""}`}
                onClick={() => handleTabChange("certifications")}
              >
                <Icons.HiOutlineCheckBadge size={20} />
{t("templates.sections.certifications")}
              </button>
            )}
            {((data.skills && data.skills.length > 0) ||
              (data.tools && data.tools.length > 0) ||
              (data.languages && data.languages.length > 0)) && (
              <button
                className={`nav-item ${activeSection === "skills" ? "active" : ""}`}
                onClick={() => handleTabChange("skills")}
              >
                <Icons.HiOutlineBolt size={20} />
{t("templates.sections.skills")}
              </button>
            )}
          </div>
        </div>

        {/* Contenu principal */}
        <div className="main-content">
          {/* Section Expérience */}
          {data.experience && data.experience.length > 0 && (
            <div
              className={`timeline-section desktop-tabs ${activeSection === "experience" ? "active" : ""} mobile-always-show`}
              id="experience"
            >
              <div className="timeline">
                {data.experience.map((exp) => (
                  <div key={exp.id} className="timeline-item">
                    <div className="timeline-indicator">
                      <div className="timeline-date">
                        <span className="date-start">
                          {formatDate(exp.from)}
                        </span>
                        <span className="date-separator"></span>
                        <span className="date-end">
                          {exp.current || exp.isCurrent ? "Present" : formatDate(exp.to)}
                        </span>
                      </div>
                    </div>
                    <div
                      className="timeline-content"
                      data-start-date={formatDate(exp.from)}
                      data-end-date={
                        exp.current ? "Present" : formatDate(exp.to)
                      }
                    >
                      <div className="timeline-header">
                        <h3 className="timeline-title">{exp.position}</h3>
                        <div className="orginfo">
                          <span className="company-name">
                            <Icons.HiOutlineBuildingOffice2 size={16} />
                            {exp.company}
                          </span>
                          {exp.location && (
                            <span className="timeline-location">
                              <Icons.HiOutlineMapPin size={16} />
                              {exp.location}
                            </span>
                          )}
                        </div>
                      </div>
                      {exp.summary && (
                        <div className="timeline-description">
                          {renderHTMLContent(exp.summary)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section Éducation */}
          {data.education && data.education.length > 0 && (
            <div
              className={`timeline-section desktop-tabs ${activeSection === "education" ? "active" : ""} mobile-always-show`}
              id="education"
            >
              <div className="timeline">
                {data.education.map((edu) => (
                  <div key={edu.id} className="timeline-item">
                    <div className="timeline-indicator">
                      <div className="timeline-date">
                        <span className="date-start">
                          {formatDate(edu.from)}
                        </span>
                        <span className="date-separator"></span>
                        <span className="date-end">{formatDate(edu.to)}</span>
                      </div>
                    </div>
                    <div
                      className="timeline-content"
                      data-start-date={formatDate(edu.from)}
                      data-end-date={formatDate(edu.to)}
                    >
                      <div className="timeline-header">
                        <h3 className="timeline-title">
                          {edu.diploma || edu.degree}
                        </h3>
                        <div className="orginfo">
                          <span className="company-name">
                            <Icons.HiOutlineBuildingOffice2 size={16} />
                            {edu.school}
                          </span>
                          {edu.location && (
                            <span className="timeline-location">
                              <Icons.HiOutlineMapPin size={16} />
                              {edu.location}
                            </span>
                          )}
                        </div>
                      </div>
                      {edu.description && (
                        <div className="timeline-description">
                          {renderHTMLContent(edu.description)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section Certifications */}
          {data.certifications && data.certifications.length > 0 && (
            <div
              className={`timeline-section desktop-tabs ${activeSection === "certifications" ? "active" : ""} mobile-always-show`}
              id="certifications"
            >
              <div className="timeline">
                {data.certifications.map((cert) => (
                  <div key={cert.id} className="timeline-item">
                    <div className="timeline-indicator">
                      <div className="timeline-date">
                        <span className="date-start">
                          {formatDate(cert.date)}
                        </span>
                      </div>
                    </div>
                    <div
                      className="timeline-content"
                      data-start-date={formatDate(cert.date)}
                      data-end-date=""
                    >
                      <div className="timeline-header">
                        <h3 className="timeline-title">{cert.name}</h3>
                        <div className="orginfo">
                          <span className="company-name">{cert.issuer}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section Skills */}
          {((data.skills && data.skills.length > 0) ||
            (data.tools && data.tools.length > 0) ||
            (data.languages && data.languages.length > 0)) && (
            <div
              className={`timeline-section desktop-tabs ${activeSection === "skills" ? "active" : ""} mobile-always-show`}
              id="skills"
            >
              <div className="skills-container">
                {/* Skills and Tools in same column */}
                {((data.skills && data.skills.length > 0) || (data.tools && data.tools.length > 0)) && (
                  <div className="skills-tools-column">
                    {/* Compétences */}
                    {data.skills && data.skills.length > 0 && (
                      <div className="skills-section">
                        <h3 className="section-title">Skills</h3>
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
                                                  : "0%",
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    {/* Outils */}
                    {data.tools && data.tools.length > 0 && (
                      <div className="tools-section">
                        <h3 className="section-title">Tools</h3>
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
                              <div key={tool.id} className="tool-item">
                                <span className="tool-name">{tool.name}</span>
                                {tool.showLevel !== false && (
                                  <div className="tool-bar">
                                    <div
                                      className="tool-level"
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
                                                  : "0%",
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Langues */}
                {data.languages && data.languages.length > 0 && data.languages.some(lang => lang.name && lang.name.trim() !== '') && (
                  <div className="languages-section">
                    <h3 className="section-title">Languages</h3>
                    <div className="section-content">
                      <div className="languages-list">
                        {data.languages.filter(lang => lang.name && lang.name.trim() !== '').map((lang) => (
                          <div key={lang.id} className="language-item">
                            <span className="language-name">
                              {lang.name}
                            </span>
                            {!hideLanguageLevels &&
                              lang.showLevel !== false && (
                                <span className="language-level">
                                  {getLanguageLevelLabel(
                                    normalizeLanguageLevel(
                                      lang.level || "beginner",
                                    ),
                                    language
                                  )}
                                </span>
                              )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Centres d'intérêt */}
                {data.hobbies && data.hobbies.length > 0 && (
                  <div className="interests-section">
                    <h3 className="section-title">Interests</h3>
                    <div className="section-content">
                      <div className="interests-list">
                        {data.hobbies.map((hobby) => (
                          <span key={hobby.id} className="interest-item">
                            {hobby.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <CVFooter
          cvData={data}
          templateId="template-landing"
          mainColor={mainColor}
          showBrevyLink={showBrevyLink}
          isPreview={isPreview}
          hasSubscription={hasSubscription}
          isPublished={isPublished}
          className="cv-footer-template"
        />
      </div>
    </div>
  );
};
