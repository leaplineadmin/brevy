import React, { useEffect } from "react";
import { MapPin, Phone, Mail, Linkedin, Globe, Building } from "lucide-react";
import "./styles/template-social.css";
import {
  getLanguageLevelLabel,
  normalizeLanguageLevel,
} from "../language-levels";
import { renderHTMLContent } from "../html-renderer";
import { formatPhoneDisplay } from "../cv-helpers";
import { CVFooter } from "@/components/shared/cv-footer";
import { useTemplateData } from "@/lib/hooks/useTemplateData";
import { TemplateProps } from "./index";
import { imagePreloader } from "@/lib/image-preloader";
import * as Icons from "@/lib/icons";
import { useLanguage } from "@/contexts/LanguageContext";

export const TemplateSocial: React.FC<TemplateProps> = ({
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
  const { data: enrichedData, defaultData, getValueWithDefault, isSectionEmpty, isPersonalFieldEmpty } =
    useTemplateData(data, isPublished);

  // Extraire les données de manière sécurisée
  const {
    personalInfo,
    experience,
    education,
    skills,
    languages,
    tools,
    certifications,
    hobbies,
  } = data;
  // Mettre à jour la couleur principale dans les variables CSS
  useEffect(() => {
    // Appliquer directement à la racine du document pour simplifier
    document.documentElement.style.setProperty("--mainColor", mainColor);

    // Appliquer également aux éléments du template pour s'assurer que ça fonctionne
    const templateElements = document.querySelectorAll(".template-social");
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
      return dateStr; // Si le mois n'est pas valide, retourner tel quel
    }

    return `${months[monthIndex]} ${year}`;
  };

  return (
    <div className="template-social template-container relative">
      <div className="resume">
        {/* Colonne gauche : profil uniquement */}
        <div className="left-col">
          <div className="bloc1">
            <div className="header-content">
              <div className="personal-info">
                <h1 className="name">
                  {getValueWithDefault(
                    personalInfo?.firstName,
                    defaultData.personalInfo.firstName,
                  )}{" "}
                  {getValueWithDefault(
                    personalInfo?.lastName,
                    defaultData.personalInfo.lastName,
                  )}
                </h1>
                <h2 className="role">
                  {getValueWithDefault(
                    personalInfo?.jobTitle || personalInfo?.position,
                    defaultData.personalInfo.jobTitle,
                  )}
                </h2>
                {(!isPublished || (personalInfo?.city && personalInfo.city.trim() !== '') || (personalInfo?.country && personalInfo.country.trim() !== '')) && (
                  <span className="personal-location">
                    <MapPin size={16} />
                    {!hideCity &&
                      getValueWithDefault(
                        personalInfo?.city,
                        defaultData.personalInfo.city,
                      )}
                    {!hideCity && personalInfo?.city ? ", " : ""}
                    {getValueWithDefault(
                      personalInfo?.country,
                      defaultData.personalInfo.country,
                    )}
                  </span>
                )}
              </div>

              {!hidePhoto &&
                (!isPublished || (personalInfo?.photoUrl && personalInfo.photoUrl.trim() !== '') || (personalInfo?.photo && personalInfo.photo.trim() !== '')) &&
                (personalInfo?.photoUrl || personalInfo?.photo) && (
                  <div className="profile-pic">
                    <img
                      src={personalInfo.photoUrl || personalInfo.photo}
                      alt={`${personalInfo?.firstName || ""} ${personalInfo?.lastName || ""}`}
                    />
                  </div>
                )}
              <div className="contact">
                <div className="contact-links">
                  <a
                    href={
                      data.personalInfo?.phone?.trim()
                        ? `tel:${data.personalInfo?.phone}`
                        : "#"
                    }
                    className="contact-item"
                    onClick={(e) => {
                      if (!data.personalInfo?.phone || data.personalInfo?.phone.trim() === '' || data.personalInfo?.phone === defaultData.personalInfo.phone) {
                        e.preventDefault();
                        onContactClick?.('phone');
                      }
                    }}
                  >
                      <div className="contact-icon">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                        >
                          <g>
                            <path
                              className="cls-1"
                              d="M14.4,10.4c-.2-.2-.5-.4-.8-.5-.6,0-1.3-.2-1.9-.5-.2,0-.5-.1-.7,0-.2,0-.5.2-.7.4l-.8.8c-1.7-.9-3.1-2.3-4-4l.8-.8c.2-.2.3-.4.4-.7,0-.2,0-.5,0-.7-.2-.6-.4-1.2-.5-1.9,0-.3-.2-.6-.5-.8-.2-.2-.6-.3-.9-.3h-2c-.2,0-.4,0-.5.1-.2,0-.3.2-.4.3-.1.1-.2.3-.3.5s0,.4,0,.5c.2,2.1.9,4,2,5.8,1,1.6,2.4,3,4,4,1.7,1.1,3.7,1.8,5.8,2,.2,0,.4,0,.5,0,.2,0,.3-.2.5-.3.1-.1.2-.3.3-.4,0-.2.1-.4.1-.5v-2c0-.3-.1-.6-.3-.9Z"
                              fill="white"
                            />
                          </g>
                        </svg>
                      </div>
                    </a>

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
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                        >
                          <g>
                            <path
                              className="cls-1"
                              d="M1.4,4.2L8,9.2l6.6-5V2.7c0-.4-.3-.7-.7-.7H2.1c-.4,0-.7.3-.7.7v1.5Z"
                              fill="white"
                            />
                            <path
                              className="cls-1"
                              d="M14.6,5.8L8,10.8L1.4,5.8v6.5c0,.4.3.7.7.7h11.8c.4,0,.7-.3.7-.7V5.8Z"
                              fill="white"
                            />
                          </g>
                        </svg>
                      </div>
                    </a>

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
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                        >
                          <g>
                            <rect
                              className="cls-1"
                              x="2.2"
                              y="6"
                              width="2.5"
                              height="8"
                              fill="white"
                            />
                            <path
                              className="cls-1"
                              d="M11,5.8c-1.2,0-2,.7-2.4,1.3h0v-1.1h-2.4v8h2.5v-4c0-1,.2-2.1,1.5-2.1s1.3,1.2,1.3,2.1v3.9h2.5v-4.4c0-2.2-.5-3.8-3-3.8Z"
                              fill="white"
                            />
                            <path
                              className="cls-1"
                              d="M3.4,2c-.8,0-1.4.6-1.4,1.4s.6,1.4,1.4,1.4,1.4-.6,1.4-1.4-.6-1.4-1.4-1.4Z"
                              fill="white"
                            />
                          </g>
                        </svg>
                      </div>
                    </a>
                  )}

                  {!hideWebsite && (
                    <a
                      href={
                        data.personalInfo?.website.startsWith("http")
                          ? data.personalInfo?.website
                          : `https://${data.personalInfo?.website}`
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
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                        >
                          <g>
                            <path
                              className="cls-1"
                              d="M8.4,1h-.4c-3.9,0-7,3.1-7,7v.4c.2,3.6,3.1,6.5,6.6,6.6h.4c3.7,0,6.8-2.9,7-6.6v-.4c0-3.7-2.9-6.8-6.6-7ZM8,13c-2.8,0-5-2.2-5-5s0,0,0,0c0,2.8,2.2,5,5,5h0ZM8,13v-1.7l-.8-1.3h-1.3v-1.3l-1.3-.8h-1.7c0-2.8,2.2-5,5-5s.3,0,.4,0v1.6l-2.1.8v1.3l1.3,1.3h1.7l.4.4.4.8h1.3v-1.3l1.6-.3c0,.1,0,.2,0,.3,0,2.8-2.2,5-5,5Z"
                              fill="white"
                            />
                          </g>
                        </svg>
                      </div>
                    </a>
                  )}
                </div>
              </div>
            </div>
            
            <div className="summary">
              {getValueWithDefault(
                personalInfo?.summary,
                defaultData.personalInfo.summary,
              )
                ? renderHTMLContent(
                    getValueWithDefault(
                      personalInfo?.summary,
                      defaultData.personalInfo.summary,
                    ),
                  )
                : ""}
            </div>
          </div>
        </div>

        {/* Colonne centrale : contenu principal */}
        <div className="center-col">
          {/* Section Experience */}
          {experience && experience.length > 0 && (
            <div className="experience section">
              <h2 className="section-title">{t("templates.sections.experience")}</h2>
              <div className="timeline">
                {experience.map((exp, index) => (
                  <div key={exp.id} className="timeline-item">
                    <div className="timeline-indicator">
                      <div className="timeline-dot" />
                      <div className="timeline-line" />
                    </div>
                    <div className="timeline-item-main">
                      <div className="timeline-date">
                        <span className="date-start">
                          {formatDate(exp.from)}
                        </span>
                        <span className="date-separator">-</span>
                        <span className="date-end">
                          {exp.current || exp.isCurrent
                            ? "Present"
                            : formatDate(exp.to)}
                        </span>
                      </div>
                      <div className="timeline-content">
                        <div className="timeline-header">
                          <h3 className="timeline-title">
                            {getValueWithDefault(
                              exp.position,
                              defaultData.experience[index]?.position ||
                                defaultData.experience[0]?.position ||
                                "",
                            )}
                          </h3>
                          <div className="orginfo">
                            <div className="company-info">
                              <Building size={16} />
                              <span className="company-name">
                                {getValueWithDefault(
                                  exp.company,
                                  defaultData.experience[index]?.company ||
                                    defaultData.experience[0]?.company ||
                                    "",
                                )}
                              </span>
                            </div>
                            <div className="location-info">
                              <MapPin size={16} />
                              <span className="timeline-location">
                                {getValueWithDefault(
                                  exp.location,
                                  defaultData.experience[index]?.location ||
                                    defaultData.experience[0]?.location ||
                                    "",
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="timeline-description">
                          {exp.description || exp.summary
                            ? renderHTMLContent(
                                exp.description || exp.summary || "",
                              )
                            : defaultData.experience[index]?.description ||
                              defaultData.experience[0]?.description ||
                              ""}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section Éducation */}
          {education && education.length > 0 && (
            <div className="education section">
              <h2 className="section-title">{t("templates.sections.education")}</h2>
              <div className="timeline">
                {education.map((edu) => (
                  <div key={edu.id} className="timeline-item">
                    <div className="timeline-indicator">
                      <div className="timeline-dot" />
                      <div className="timeline-line" />
                    </div>
                    <div className="timeline-item-main">
                      <div className="timeline-date">
                        <span className="date-start">
                          {formatDate(edu.from)}
                        </span>
                        <span className="date-separator">-</span>
                        <span className="date-end">
                          {formatDate(edu.to) || "Present"}
                        </span>
                      </div>
                      <div className="timeline-content">
                        <div className="timeline-header">
                          <h3 className="timeline-title">
                            {edu.degree || edu.diploma}
                          </h3>
                          <div className="orginfo">
                            <div className="company-info">
                              <Building size={16} />
                              <span className="company-name">{edu.school}</span>
                            </div>
                            {edu.location && (
                              <div className="location-info">
                                <MapPin size={16} />
                                <span className="timeline-location">
                                  {edu.location}
                                </span>
                              </div>
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
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section Certifications - sous Education avec les mêmes styles */}
          {certifications && certifications.length > 0 && (
            <div className="education section">
              <h2 className="section-title">{t("templates.sections.certifications")}</h2>
              <div className="timeline">
                {certifications.map((cert) => (
                  <div key={cert.id} className="timeline-item">
                    <div className="timeline-indicator">
                      <div className="timeline-dot" />
                      <div className="timeline-line" />
                    </div>
                    <div className="timeline-item-main">
                      <div className="timeline-date">
                        <span className="date-start">
                          {formatDate(cert.date)}
                        </span>
                      </div>
                      <div className="timeline-content">
                        <div className="timeline-header">
                          <h3 className="timeline-title">{cert.name}</h3>
                          <div className="orginfo">
                            <div className="company-info">
                              <Building size={16} />
                              <span className="company-name">
                                {cert.issuer}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Colonne droite : compétences et langues */}
        <div className="right-col">
          <div className="bloc2">
            {/* Compétences */}
            {skills && skills.length > 0 && (
              <div className="skills section">
                <h2 className="section-title">{t("templates.sections.skills")}</h2>
                <div className="skills-container">
                  {hideSkillLevels ? (
                    <div className="skills-horizontal">
                      {skills.map((skill, index) => (
                        <span key={skill.id} className="skill-name-only">
                          {getValueWithDefault(
                            skill.name,
                            defaultData.skills[index]?.name ||
                              defaultData.skills[0]?.name ||
                              "",
                          )}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="skills-list">
                      {skills.map((skill, index) => (
                        <div key={skill.id} className="skill-item">
                          <span className="skill-name">
                            {getValueWithDefault(
                              skill.name,
                              defaultData.skills[index]?.name ||
                                defaultData.skills[0]?.name ||
                                "",
                            )}
                          </span>
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
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Section Outils - sous Compétences avec les mêmes styles */}
            {tools && tools.length > 0 && (
              <div className="skills section">
                <h2 className="section-title">{t("templates.sections.tools")}</h2>
                <div className="skills-container">
                  {hideSkillLevels ? (
                    <div className="skills-horizontal">
                      {tools.map((tool, index) => (
                        <span key={tool.id} className="skill-name-only">
                          {getValueWithDefault(
                            tool.name,
                            defaultData.tools?.[index]?.name ||
                              defaultData.tools?.[0]?.name ||
                              "",
                          )}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="skills-list">
                      {tools.map((tool, index) => (
                        <div key={tool.id} className="skill-item">
                          <span className="skill-name">
                            {getValueWithDefault(
                              tool.name,
                              defaultData.tools?.[index]?.name ||
                                defaultData.tools?.[0]?.name ||
                                "",
                            )}
                          </span>
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
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Langues */}
            {languages && languages.length > 0 && languages.some(lang => lang.name && lang.name.trim() !== '') && (
              <div className="languages section">
                <h2 className="section-title">{t("templates.sections.languages")}</h2>
                <div className="languages-container">
                  {languages.filter(lang => lang.name && lang.name.trim() !== '').map((lang, index) => (
                    <div key={lang.id} className="language-item">
                      <span className="language-name">
                        {getValueWithDefault(
                          lang.name,
                          defaultData.languages[index]?.name ||
                            defaultData.languages[0]?.name ||
                            "",
                        )}
                      </span>
                      {!hideLanguageLevels && lang.showLevel !== false && (
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
            )}

            {/* Section Hobbies - sous Langues avec les mêmes styles */}
            {hobbies && hobbies.length > 0 && (
              <div className="skills section">
                <h2 className="section-title">{t("templates.sections.hobbies")}</h2>
                <div className="skills-container">
                  {hobbies.map((hobby, index) => (
                    <div key={hobby.id} className="skill-name-only">
                      {hobby.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer unifié avec PDF et Brevy */}
      <CVFooter
        cvData={data}
        templateId="template-social"
        mainColor={mainColor}
        showBrevyLink={true}
        isPreview={isPreview}
        hasSubscription={hasSubscription}
        isPublished={isPublished}
        className="cv-footer-template"
      />
      </div>
    </div>
  );
};
