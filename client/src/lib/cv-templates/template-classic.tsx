import React, { useState, useEffect } from "react";
import { TemplateProps } from "./index";
import {
  getLanguageLevelLabel,
  normalizeLanguageLevel,
} from "../language-levels";
import { renderHTMLContent } from "../html-renderer";
import { formatPhoneDisplay } from "../cv-helpers";
import { CVFooter } from "@/components/shared/cv-footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTemplateData } from "@/lib/hooks/useTemplateData";
import { imagePreloader } from "@/lib/image-preloader";
import * as Icons from '@/lib/icons';

export const TemplateClassic: React.FC<TemplateProps> = ({
  data,
  mainColor,
  hidePhoto,
  hideCity,
  hideSkillLevels,
  hideToolLevels,
  hideLanguageLevels,
  hideLinkedIn,
  hideWebsite,
  showBrevyLink = false,
  isPreview = false,
  hasSubscription = false,
  isPublished = false,
  onContactClick,
}) => {
  const { t, language } = useLanguage();
  const {
    data: enrichedData,
    getValueWithDefault,
    defaultData,
    isSectionEmpty,
    isPersonalFieldEmpty,
  } = useTemplateData(data, isPublished);
  // Mettre à jour la couleur principale dans les variables CSS
  useEffect(() => {
    document.documentElement.style.setProperty("--mainColor", mainColor);
  }, [mainColor]);

  // Extraire les données de manière sécurisée
  // Utiliser les noms de propriétés exacts tels qu'ils sont dans l'application
  const {
    personalInfo,
    experience,
    education,
    skills,
    languages,
    hobbies,
    certifications,
  } = data;

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

  return (
    <div className="template-classic template-container relative">
      <div className="resume">
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
                {(!isPublished || (enrichedData.personalInfo.city && enrichedData.personalInfo.city.trim() !== '') || (enrichedData.personalInfo.country && enrichedData.personalInfo.country.trim() !== '')) && (
                  <span className="personal-location">
                    <Icons.HiOutlineMapPin size={20} />
                    {!hideCity && enrichedData.personalInfo.city
                      ? enrichedData.personalInfo.city
                      : ""}
                    {enrichedData.personalInfo?.country &&
                    !hideCity &&
                    enrichedData.personalInfo.city
                      ? ", "
                      : ""}
                    {enrichedData.personalInfo?.country
                      ? enrichedData.personalInfo.country
                      : ""}
                  </span>
                )}
                <div className="contact">
                  <div className="contact-links">
                    <a
                        href={
                          data.personalInfo?.phone ? `tel:${data.personalInfo?.phone}` : "#"
                        }
                        className="contact-item"
                        onClick={(e) => {
                          if (!data.personalInfo?.phone || data.personalInfo?.phone.trim() === '' || data.personalInfo?.phone === defaultData.personalInfo.phone) {
                            e.preventDefault();
                            onContactClick?.('phone');
                          }
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
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
                          <div className="contact-item-link">
                            <span>
                              {formatPhoneDisplay(
                                personalInfo?.phone,
                                data.phoneCountryCode,
                              )}
                            </span>
                            <Icons.HiOutlineChevronRight size={18}/>
                          </div>
                        </div>
                      </a>
                    <a
                      href={
                        data.personalInfo?.email
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
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
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
                                  d="M1.4,3.6l5.8,3.5c.2.1.5.2.7.2.3,0,.5,0,.7-.2.2-.1,5.5-3.3,5.8-3.5.4-.2.7-1.1,0-1.1H1.4c-.7,0-.3.9,0,1.1Z"
                                  fill="white"
                                />
                                <path
                                  className="cls-1"
                                  d="M14.7,5.6l-6,3.5c-.3.2-.4.2-.7.2-.2,0-.5,0-.7-.2L1.3,5.6c-.3-.2-.3,0-.3.2v6.9c0,.4.4.9.8.9h12.4c.3,0,.8-.5.8-.9v-6.9c0-.2,0-.4-.3-.2Z"
                                  fill="white"
                                />
                              </g>
                            </svg>
                          </div>
                          <div className="contact-item-link">
                            <span>{t("templates.contacts.sendEmail")}</span>
                            <Icons.HiOutlineArrowTopRightOnSquare size={18}/>
                          </div>
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
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
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
                          <div className="contact-item-link">
                            <span>{t("templates.contacts.viewLinkedin")}</span>
                            <Icons.HiOutlineArrowTopRightOnSquare size={18}/>
                          </div>
                        </div>
                      </a>
                    )}
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
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
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
                          <div className="contact-item-link">
                            <span>View my website</span>
                            <Icons.HiOutlineArrowTopRightOnSquare size={18}/>
                          </div>
                        </div>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {!hidePhoto && (!isPublished || (personalInfo?.photoUrl && personalInfo.photoUrl.trim() !== '') || (personalInfo?.photo && personalInfo.photo.trim() !== '')) && (
                <div className="profile-pic">
                  <img
                    src={
                      (personalInfo?.photoUrl &&
                        personalInfo.photoUrl !== "") ||
                      (personalInfo?.photo && personalInfo.photo !== "")
                        ? personalInfo?.photoUrl || personalInfo?.photo
                        : imagePreloader.getImageSrc("1")
                    }
                    alt={`${personalInfo?.firstName || ""} ${personalInfo?.lastName || ""}`}
                    loading="eager"
                    decoding="sync"
                  />
                </div>
              )}
            </div>

            {(!isPublished || (personalInfo?.summary && personalInfo.summary.trim() !== '')) && (
              <div className="summary">
                {personalInfo?.summary
                  ? renderHTMLContent(personalInfo.summary)
                  : defaultData.personalInfo.summary}
              </div>
            )}
          </div>

          <div className="bloc2">
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
                    skills.map((skill, index) => (
                      <div className="skill-item" key={skill.id}>
                        <span className="skill-name">
                          {getValueWithDefault(
                            skill.name,
                            defaultData.skills[index]?.name ||
                              defaultData.skills[0]?.name ||
                              "",
                          )}
                        </span>
                        {skill.showLevel !== false && (
                          <div className="skills-bar">
                            <span
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
                              }}
                            ></span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Section Outils - sous Compétences avec les mêmes styles */}
            {data.tools && data.tools.length > 0 && (
              <div className="skills section">
                <h2 className="section-title">
                  {t("cvBuilder.templates.sections.tools")}
                </h2>
                <div className="skills-container">
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
                      <div className="skill-item" key={tool.id}>
                        <span className="skill-name">{tool.name}</span>
                        {tool.showLevel !== false && (
                          <div className="skills-bar">
                            <span
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
                              }}
                            ></span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {languages && languages.length > 0 && languages.some(lang => lang.name && lang.name.trim() !== '') && (
              <div className="languages section">
                <h2 className="section-title">
                  {t("cvBuilder.templates.sections.languages")}
                </h2>
                <div className="languages-list">
                  {hideLanguageLevels ? (
                    <div className="languages-horizontal">
                      {languages.filter(lang => lang.name && lang.name.trim() !== '').map((language, index) => (
                        <React.Fragment key={language.id}>
                          <span className="language-name-only">
                            {getValueWithDefault(
                              language.name,
                              defaultData.languages[index]?.name ||
                                defaultData.languages[0]?.name ||
                                "",
                            )}
                          </span>
                          {index < languages.filter(lang => lang.name && lang.name.trim() !== '').length - 1 && (
                            <span className="language-separator"> | </span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  ) : (
                    languages.filter(lang => lang.name && lang.name.trim() !== '').map((lang, index) => (
                      <div className="language-item" key={lang.id}>
                        <span className="language-name">
                          {getValueWithDefault(
                            lang.name,
                            defaultData.languages[index]?.name ||
                              defaultData.languages[0]?.name ||
                              "",
                          )}
                        </span>
                        <span className="language-level">
                          {getLanguageLevelLabel(
                            normalizeLanguageLevel(
                              lang.level || "beginner",
                            ),
                            language
                          )}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {hobbies && hobbies.length > 0 && (
              <div className="hobbies section">
                <h2 className="section-title">
                  {t("cvBuilder.templates.sections.hobbies")}
                </h2>
                <div className="hobbies-list">
                  {hobbies.map((hobby) => (
                    <div className="hobby-item" key={hobby.id}>
                      {hobby.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bloc3">
          <div className="gradients">
            <div className="shape purpleLeft"></div>
            <div className="shape purpleRight"></div>
          </div>

          {experience && experience.length > 0 && (
            <div className="experience section">
              <h2 className="section-title">
                {t("cvBuilder.templates.sections.experience")}
              </h2>
              <div className="timeline">
                {experience.map((exp, index) => (
                  <div className="timeline-item" key={exp.id}>
                    <div className="timeline-line">
                      <div className="dot"></div>
                      <div className="line"></div>
                    </div>
                    <div className="timeline-date">
                      <div className="start">
                        {formatDate(
                          exp.from ||
                            (exp.startMonth && exp.startYear
                              ? `${exp.startMonth}/${exp.startYear}`
                              : ""),
                        )}
                      </div>
                      <div className="line-segment"></div>
                      <div className="end">
                        {exp.current || exp.isCurrent
                          ? t("cvBuilder.templates.experience.present")
                          : formatDate(
                              exp.to ||
                                (exp.endMonth && exp.endYear
                                  ? `${exp.endMonth}/${exp.endYear}`
                                  : ""),
                            )}
                      </div>
                    </div>
                    <div className="timeline-content">
                      <div className="orginfo">
                        <div className="position">
                          {getValueWithDefault(
                            exp.position,
                            defaultData.experience[index]?.position ||
                              defaultData.experience[0]?.position ||
                              "",
                          )}
                        </div>
                        <span className="placename">
                          {getValueWithDefault(
                            exp.company,
                            defaultData.experience[index]?.company ||
                              defaultData.experience[0]?.company ||
                              "",
                          )}
                        </span>
                      </div>
                      <div className="location">
                        <Icons.HiOutlineMapPin size={20} />
                        {getValueWithDefault(
                          exp.location,
                          defaultData.experience[index]?.location ||
                            defaultData.experience[0]?.location ||
                            "",
                        )}
                      </div>
                      <div className="description">
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
                ))}
              </div>
            </div>
          )}

          {education && education.length > 0 && (
            <div className="education section">
              <h2 className="section-title">
                {t("cvBuilder.templates.sections.education")}
              </h2>
              <div className="timeline">
                {education.map((edu, index) => (
                  <div className="timeline-item" key={edu.id}>
                    <div className="timeline-line">
                      <div className="dot"></div>
                      <div className="line"></div>
                    </div>
                    <div className="timeline-date">
                      <div className="start">
                        {formatDate(
                          edu.from ||
                            (edu.startMonth && edu.startYear
                              ? `${edu.startMonth}/${edu.startYear}`
                              : ""),
                        )}
                      </div>
                      <div className="line-segment"></div>
                      <div className="end">
                        {formatDate(
                          edu.to ||
                            (edu.endMonth && edu.endYear
                              ? `${edu.endMonth}/${edu.endYear}`
                              : ""),
                        )}
                      </div>
                    </div>
                    <div className="timeline-content">
                      <div className="orginfo">
                        <div className="position">
                          {getValueWithDefault(
                            edu.diploma || edu.degree || t("templates.fields.degree"),
                            defaultData.education[index]?.diploma ||
                              defaultData.education[0]?.diploma ||
                              "",
                          )}
                        </div>
                        <span className="placename">
                          {getValueWithDefault(
                            edu.school,
                            defaultData.education[index]?.school ||
                              defaultData.education[0]?.school ||
                              "",
                          )}
                        </span>
                      </div>
                      <div className="location">
                        <Icons.HiOutlineMapPin size={20} />
                        {getValueWithDefault(
                          edu.location,
                          defaultData.education[index]?.location ||
                            defaultData.education[0]?.location ||
                            "",
                        )}
                      </div>
                      <div className="description">
                        {edu.description
                          ? renderHTMLContent(edu.description)
                          : ""}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {certifications && certifications.length > 0 && (
            <div className="certifications section">
              <h2 className="section-title">
                {t("cvBuilder.templates.sections.certifications")}
              </h2>
              <div className="timeline">
                {certifications.map((cert) => (
                  <div className="timeline-item" key={cert.id}>
                    <div className="timeline-line">
                      <div className="dot"></div>
                      <div className="line"></div>
                    </div>
                    <div className="timeline-date">
                      <div className="start">{cert.date}</div>
                    </div>
                    <div className="timeline-content">
                      <div className="position">{cert.name}</div>
                      <h3 className="placename">{cert.issuer}</h3>
                    </div>
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
        templateId="template-classic"
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

export default TemplateClassic;
