import React, { useEffect } from "react";
import "./styles/template-bento.css";
import {
  getLanguageLevelLabel,
  normalizeLanguageLevel,
} from "../language-levels";
import { renderHTMLContent } from "../html-renderer";
import { formatPhoneDisplay } from "../cv-helpers";
import { CVFooter } from "@/components/shared/cv-footer";
import { useTemplateData } from "@/lib/hooks/useTemplateData";
import { formatEducationDate, formatExperienceDate } from "./utils/date-formatters";
import { TemplateProps } from "./index";
import { imagePreloader } from "@/lib/image-preloader";
import * as Icons from "@/lib/icons";
import { useLanguage } from "@/contexts/LanguageContext";

export const TemplateBento: React.FC<TemplateProps> = ({
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
  const {
    data: enrichedData,
    getValueWithDefault,
    defaultData,
    isSectionEmpty,
    isPersonalFieldEmpty,
  } = useTemplateData(data, isPublished);

  useEffect(() => {
    const templateElement = document.querySelector(
      ".template-bento",
    ) as HTMLElement;
    if (templateElement) {
      templateElement.style.setProperty("--mainColor", mainColor);
    }
  }, [mainColor]);

  // Format de date helper pour l'expérience (mois/année)
  const formatDate = (dateStr?: string): string => {
    return formatExperienceDate(dateStr);
  };

  return (
    <div
      className="template-bento template-container relative"
      style={{ "--mainColor": mainColor } as React.CSSProperties}
    >
      <div className="resume">
        <div className="header-card">
          <div className="header-content">
            {!hidePhoto && (!isPublished || (data.personalInfo?.photoUrl && data.personalInfo?.photoUrl.trim() !== '') || (data.personalInfo?.photo && data.personalInfo?.photo.trim() !== '')) && (
              <div className="profile-pic">
                <img
                  src={
                    (data.personalInfo?.photoUrl &&
                      data.personalInfo?.photoUrl !== "") ||
                    (data.personalInfo?.photo && data.personalInfo?.photo !== "")
                      ? data.personalInfo?.photoUrl || data.personalInfo?.photo
                      : imagePreloader.getImageSrc("4")
                  }
                  alt={`${data.personalInfo?.firstName || ""} ${data.personalInfo?.lastName || ""}`}
                  loading="eager"
                  decoding="sync"
                />
              </div>
            )}

            <div className="header-text">
              <div className="personal-info">
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
                <h2 className="role">
                  {getValueWithDefault(
                    data.personalInfo?.position || data.personalInfo?.jobTitle,
                    defaultData.personalInfo.jobTitle,
                  )}
                </h2>
                {(data.personalInfo?.city || data.personalInfo?.country) && (
                  <span className="personal-location">
                    <Icons.HiOutlineMapPin size={20} />
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
                )}
              </div>
            </div>
          </div>

          <div className="bento-card contact-card">
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
                    <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
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
                        data.personalInfo?.phone,
                        data.phoneCountryCode,
                      )}
                    </span>
                    <svg className="link-arrow" viewBox="0 0 16 16" fill="none">
                      <g>
                        <path
                          d="M12.2,7.3L7.4,2.5h0c-.4-.4-1-.4-1.3,0-.4.4-.4.9,0,1.3h0c0,0,4.1,4.2,4.1,4.2l-4.1,4.1c-.4.4-.4,1,0,1.4.4.4,1,.4,1.4,0l4.8-4.8c.2-.2.3-.4.3-.7,0-.3-.1-.5-.3-.7Z"
                          fill="currentColor"
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
                    <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
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
                    <svg className="link-arrow" viewBox="0 0 16 16" fill="none">
                      <g>
                        <path
                          d="M13.2,2.7c-.2-.2-.4-.3-.7-.3h-7c-.5,0-.9.5-.9,1,0,.5.4.9.9,1h.1s4.5,0,4.5,0l-7.6,7.6c-.4.4-.4,1,0,1.4.4.4,1,.4,1.4,0l7.6-7.6v4.4c0,.6.4,1,1,1,.6,0,1-.4,1-1V3.4c0-.3-.1-.5-.3-.7Z"
                          fill="currentColor"
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
                    <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
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
                    <svg className="link-arrow" viewBox="0 0 16 16" fill="none">
                      <g>
                        <path
                          d="M13.2,2.7c-.2-.2-.4-.3-.7-.3h-7c-.5,0-.9.5-.9,1,0,.5.4.9.9,1h.1s4.5,0,4.5,0l-7.6,7.6c-.4.4-.4,1,0,1.4.4.4,1,.4,1.4,0l7.6-7.6v4.4c0,.6.4,1,1,1,.6,0,1-.4,1-1V3.4c0-.3-.1-.5-.3-.7Z"
                          fill="currentColor"
                        />
                      </g>
                    </svg>
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
                  <div className="contact-icon">
                    <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
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
                    <svg className="link-arrow" viewBox="0 0 16 16" fill="none">
                      <g>
                        <path
                          d="M13.2,2.7c-.2-.2-.4-.3-.7-.3h-7c-.5,0-.9.5-.9,1,0,.5.4.9.9,1h.1s4.5,0,4.5,0l-7.6,7.6c-.4.4-.4,1,0,1.4.4.4,1,.4,1.4,0l7.6-7.6v4.4c0,.6.4,1,1,1,.6,0,1-.4,1-1V3.4c0-.3-.1-.5-.3-.7Z"
                          fill="currentColor"
                        />
                      </g>
                    </svg>
                  </div>
                </a>
              )}
            </div>
          </div>
        </div>

        {data.personalInfo?.summary && (
          <div className="summary">
            {renderHTMLContent(data.personalInfo?.summary)}
          </div>
        )}

        <div className="left-column">
          {data.experience && data.experience.length > 0 && (
            <div className="bento-card experience-card">
              <div className="experience section">
                <span className="section-title">
                  <Icons.HiOutlineBriefcase size={24} />
                  {t("templates.sections.experience")}
                </span>
                <div className="timeline">
                  {data.experience.map((exp) => (
                    <div key={exp.id} className="timeline-item">
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
                            ? "Present"
                            : formatDate(
                                exp.to ||
                                  (exp.endMonth && exp.endYear
                                    ? `${exp.endMonth}/${exp.endYear}`
                                    : ""),
                              )}
                        </div>
                      </div>
                      <div className="timeline-content">
                        <div className="position">{exp.position}</div>
                        <div className="orginfo">
                          <h3 className="placename">{exp.company}</h3>
                          <div className="location">{exp.location}</div>
                        </div>
                        {(exp.summary || exp.description) && (
                          <div className="description">
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
            </div>
          )}

          {/* Education Card */}
          {data.education && data.education.length > 0 && (
            <div className="bento-card education-card">
              <div className="education section">
                <span className="section-title">
                  <Icons.HiOutlineAcademicCap size={24} />
                  {t("templates.sections.education")}
                </span>
                <div className="timeline">
                  {data.education.map((edu) => (
                    <div key={edu.id} className="timeline-item">
                      <div className="timeline-line">
                        <div className="dot"></div>
                        <div className="line"></div>
                      </div>
                      <div className="timeline-date">
                        <div className="start">
                          {formatEducationDate(
                            edu.from ||
                              (edu.startMonth && edu.startYear
                                ? `${edu.startMonth}/${edu.startYear}`
                                : ""),
                          )}
                        </div>
                        <div className="line-segment"></div>
                        <div className="end">
                          {formatEducationDate(
                            edu.to ||
                              (edu.endMonth && edu.endYear
                                ? `${edu.endMonth}/${edu.endYear}`
                                : ""),
                          )}
                        </div>
                      </div>
                      <div className="timeline-content">
                        <div className="position">
                          {edu.diploma || edu.degree || t("templates.fields.degree")}
                        </div>
                        <div className="orginfo">
                          {edu.school && (
                            <h3 className="placename">{edu.school}</h3>
                          )}
                          {edu.location && (
                            <div className="location">{edu.location}</div>
                          )}
                        </div>
                        <div className="description">
                          {edu.description
                            ? renderHTMLContent(edu.description)
                            : "Comprehensive education in the field of study. Acquisition of theoretical and practical skills."}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="right-column">
          {/* Skills Card */}
          {data.skills && data.skills.length > 0 && (
            <div className="bento-card skills-card">
              <div className="skills section">
                <span className="section-title">
                  <Icons.HiOutlineBolt size={24} />
                  {t("templates.sections.skills")}
                </span>
                {hideSkillLevels ? (
                  <div className="skills-horizontal">
                    {data.skills.map((skill) => (
                      <span key={skill.id} className="skill-name-only">
                        {skill.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="skills-container">
                    {data.skills.map((skill) => (
                      <div key={skill.id} className="skill-item">
                        <span className="skill-name">{skill.name}</span>
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
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {data.certifications && data.certifications.length > 0 && (
            <div className="bento-card certifications-card">
              <div className="certifications section">
                <span className="section-title">
                  <Icons.HiOutlineCheckBadge size={24} />
                  {t("templates.sections.certifications")}
                </span>
                <div className="timeline">
                  {data.certifications.map((cert) => (
                    <div key={cert.id} className="timeline-item">
                      <div className="timeline-line">
                        <div className="dot"></div>
                        <div className="line"></div>
                      </div>
                      <div className="timeline-date">
                        <div className="start">{formatEducationDate(cert.date)}</div>
                      </div>
                      <div className="timeline-content">
                        <div className="position">{cert.name}</div>
                        <h3 className="placename">{cert.issuer}</h3>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {data.tools && data.tools.length > 0 && (
            <div className="bento-card tools-card">
              <div className="tools section">
                <span className="section-title">
                  <Icons.HiOutlineLightBulb size={24} />
                  {t("templates.sections.tools")}
                </span>
                {hideToolLevels ? (
                  <div className="skills-horizontal">
                    {data.tools.map((tool) => (
                      <span key={tool.id} className="skill-name-only">
                        {tool.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="tools-container">
                    {data.tools.map((tool) => (
                      <div key={tool.id} className="tool-item">
                        <span className="tool-name">{tool.name}</span>
                        {tool.showLevel !== false && (
                          <div className="tools-bar">
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
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Languages Card */}
          {data.languages && data.languages.length > 0 && (
            <div className="bento-card languages-card">
              <div className="languages section">
                <span className="section-title">
                  <Icons.HiLanguage size={24} />
                  {t("templates.sections.languages")}
                </span>
                <div className="languages-list">
                  {data.languages.map((lang) => (
                    <div key={lang.id} className="badge">
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

          {data.hobbies && data.hobbies.length > 0 && (
            <div className="bento-card hobbies-card">
              <div className="hobbies section">
                <span className="section-title">
                  <Icons.HiOutlineHeart size={24} />
                  {t("templates.sections.hobbies")}
                </span>
                <div className="hobbies-list">
                  {data.hobbies.map((hobby) => (
                    <div key={hobby.id} className="badge">
                      {hobby.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer unifié avec PDF et Brevy */}
      <CVFooter
        cvData={data}
        templateId="template-bento"
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

export default TemplateBento;
