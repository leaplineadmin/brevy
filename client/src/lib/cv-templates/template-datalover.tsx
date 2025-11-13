import React, { useEffect, useRef } from "react";
import "./styles/template-datalover.css";
import {
  getLanguageLevelLabel,
  normalizeLanguageLevel,
} from "../language-levels";
import { renderHTMLContent } from "../html-renderer";
import { formatPhoneDisplay } from "../cv-helpers";
import {
  initWavesAnimation,
  initStickySidebar,
} from "./scripts/template-5-waves";
import { CVFooter } from "@/components/shared/cv-footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTemplateData } from "@/lib/hooks/useTemplateData";
import { TemplateProps } from "./index";
import { imagePreloader } from "@/lib/image-preloader";
import * as Icons from '@/lib/icons';

export const TemplateDatalover: React.FC<TemplateProps> = ({
  data,
  mainColor,
  hidePhoto = false,
  hideCity = false,
  hideSkillLevels = false,
  hideToolLevels = false,
  hideLanguageLevels = false,
  hideLinkedIn = false,
  hideWebsite = false,
  showBrevyLink = true,
  isPreview = false,
  hasSubscription = false,
  isPublished = false,
  onContactClick,
}) => {
  const { t, language } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cleanupRef = useRef<(() => void)[]>([]);
  const {
    data: enrichedData,
    getValueWithDefault,
    defaultData,
    isSectionEmpty,
    isPersonalFieldEmpty,
  } = useTemplateData(data, isPublished);

  // Format date helper
  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return "";

    let month, year;

    if (dateStr.includes("/")) {
      [month, year] = dateStr.split("/");
    } else if (dateStr.includes("-")) {
      [year, month] = dateStr.split("-");
    } else {
      return dateStr || "";
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
      return dateStr;
    }

    return `${months[monthIndex]} ${year}`;
  };

  // Format date range for experience
  const formatDateRange = (
    from?: string,
    to?: string,
    current?: boolean,
  ): string => {
    const fromFormatted = formatDate(from);
    const toFormatted = current ? "Present" : formatDate(to);

    if (fromFormatted && toFormatted) {
      return `${fromFormatted} — ${toFormatted}`;
    }
    return fromFormatted || toFormatted || "";
  };

  useEffect(() => {
    // Appliquer la couleur principale
    document.documentElement.style.setProperty("--mainColor", mainColor);

    const templateElements = document.querySelectorAll(".template-datalover");
    templateElements.forEach((element) => {
      (element as HTMLElement).style.setProperty("--mainColor", mainColor);
    });

    // Initialiser l'animation des vagues
    if (canvasRef.current) {
      const cleanupWaves = initWavesAnimation(canvasRef.current, mainColor);
      if (cleanupWaves) {
        cleanupRef.current.push(cleanupWaves);
      }
    }

    // Initialiser le sticky sidebar avec détection multi-container
    const cleanupSticky = initStickySidebar();
    if (cleanupSticky) {
      cleanupRef.current.push(cleanupSticky);
    }

    // Cleanup function
    return () => {
      cleanupRef.current.forEach((cleanup) => cleanup());
      cleanupRef.current = [];
    };
  }, [mainColor]);

  // Sticky fonctionnalité supprimée

  return (
    <div
      className="template-datalover template-container relative"
      style={{ "--mainColor": mainColor } as React.CSSProperties}
    >
      {/* Header avec animation canvas */}
      <header className="waves-header">
        <canvas id="wavesCanvas" ref={canvasRef}></canvas>
      </header>

      {/* Container principal avec sidebar et content */}
      <div className="container">
        {/* Sidebar gauche */}
        <aside className="sidebar">
          <div className="sidebar-inner">
            {/* Profile photo */}
            {!hidePhoto && (!isPublished || (data.personalInfo?.photoUrl && data.personalInfo?.photoUrl.trim() !== '') || (data.personalInfo?.photo && data.personalInfo?.photo.trim() !== '')) && (
              <div className="profile-pic">
                <img
                  src={
                    (data.personalInfo?.photoUrl &&
                      data.personalInfo?.photoUrl !== "") ||
                    (data.personalInfo?.photo && data.personalInfo?.photo !== "")
                      ? data.personalInfo?.photoUrl || data.personalInfo?.photo
                      : imagePreloader.getImageSrc("5")
                  }
                  alt="Profile photo"
                  loading="eager"
                  decoding="sync"
                />
              </div>
            )}

            {/* Name and title */}
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

            {/* Localisation */}
            {(!isPublished || (data.personalInfo?.city && data.personalInfo?.city.trim() !== '') || (data.personalInfo?.country && data.personalInfo?.country.trim() !== '')) && (data.personalInfo?.city || data.personalInfo?.country) && (
              <span className="personal-location">
                <Icons.HiOutlineMapPin size={16} />
                {!hideCity && data.personalInfo?.city
                  ? data.personalInfo?.city
                  : ""}
                {data.personalInfo?.country &&
                !hideCity &&
                data.personalInfo?.city
                  ? ", "
                  : ""}
                {data.personalInfo?.country ? data.personalInfo?.country : ""}
              </span>
            )}

            {/* Summary */}
            {(!isPublished || (data.personalInfo?.summary && data.personalInfo?.summary.trim() !== '')) && (
              <div className="summary">
                {data.personalInfo?.summary ? (
                  renderHTMLContent(data.personalInfo?.summary)
                ) : (
                  <p>
                    Dynamic and client-focused professional with over 4 years of
                    experience...
                  </p>
                )}
              </div>
            )}

            {/* Contact */}
            <div className="contact">
              <div className="contact-info">
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
                        width="18"
                        height="18"
                        viewBox="0 0 16 16"
                        fill="none"
                      >
                        <g>
                          <path
                            className="cls-1"
                            d="M14.4,10.4c-.2-.2-.5-.4-.8-.5-.6,0-1.3-.2-1.9-.5-.2,0-.5-.1-.7,0-.2,0-.5.2-.7.4l-.8.8c-1.7-.9-3.1-2.3-4-4l.8-.8c.2-.2.3-.4.4-.7,0-.2,0-.5,0-.7-.2-.6-.4-1.2-.5-1.9,0-.3-.2-.6-.5-.8-.2-.2-.6-.3-.9-.3h-2c-.2,0-.4,0-.5.1-.2,0-.3.2-.4.3-.1.1-.2.3-.3.5s0,.4,0,.5c.2,2.1.9,4,2,5.8,1,1.6,2.4,3,4,4,1.7,1.1,3.7,1.8,5.8,2,.2,0,.4,0,.5,0,.2,0,.3-.2.5-.3.1-.1.2-.3.3-.4,0-.2.1-.4.1-.5v-2c0-.3-.1-.6-.3-.9Z"
                            fill="var(--mainColor)"
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
                      <svg
                        className="link-arrow"
                        viewBox="0 0 16 16"
                        fill="none"
                      >
                        <g>
                          <path
                            d="M12.2,7.3L7.4,2.5h0c-.4-.4-1-.4-1.3,0-.4.4-.4.9,0,1.3h0c0,0,4.1,4.2,4.1,4.2l-4.1,4.1c-.4.4-.4,1,0,1.4.4.4,1,.4,1.4,0l4.8-4.8c.2-.2.3-.4.3-.7,0-.3-.1-.5-.3-.7Z"
                            fill="var(--mainColor)"
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
                        width="18"
                        height="18"
                        viewBox="0 0 16 16"
                        fill="none"
                      >
                        <g>
                          <path
                            className="cls-1"
                            d="M1.4,3.6l5.8,3.5c.2.1.5.2.7.2.3,0,.5,0,.7-.2.2-.1,5.5-3.3,5.8-3.5.4-.2.7-1.1,0-1.1H1.4c-.7,0-.3.9,0,1.1Z"
                            fill="var(--mainColor)"
                          />
                          <path
                            className="cls-1"
                            d="M14.7,5.6l-6,3.5c-.3.2-.4.2-.7.2-.2,0-.5,0-.7-.2L1.3,5.6c-.3-.2-.3,0-.3.2v6.9c0,.4.4.9.8.9h12.4c.3,0,.8-.5.8-.9v-6.9c0-.2,0-.4-.3-.2Z"
                            fill="var(--mainColor)"
                          />
                        </g>
                      </svg>
                    </div>
                    <div className="contact-item-link">
                      <span>{t("templates.contacts.sendEmail")}</span>
                      <svg className="link-arrow" viewBox="0 0 16 16" fill="none">
                        <g>
                          <path d="M13.2,2.7c-.2-.2-.4-.3-.7-.3h-7c-.5,0-.9.5-.9,1,0,.5.4.9.9,1h.1s4.5,0,4.5,0l-7.6,7.6c-.4.4-.4,1,0,1.4.4.4,1,.4,1.4,0l7.6-7.6v4.4c0,.6.4,1,1,1,.6,0,1-.4,1-1V3.4c0-.3-.1-.5-.3-.7Z" fill="currentColor"/>
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
                        width="18"
                        height="18"
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
                            fill="var(--mainColor)"
                          />
                          <path
                            className="cls-1"
                            d="M11,5.8c-1.2,0-2,.7-2.4,1.3h0v-1.1h-2.4v8h2.5v-4c0-1,.2-2.1,1.5-2.1s1.3,1.2,1.3,2.1v3.9h2.5v-4.4c0-2.2-.5-3.8-3-3.8Z"
                            fill="var(--mainColor)"
                          />
                          <path
                            className="cls-1"
                            d="M3.4,2c-.8,0-1.4.6-1.4,1.4s.6,1.4,1.4,1.4,1.4-.6,1.4-1.4-.6-1.4-1.4-1.4Z"
                            fill="var(--mainColor)"
                          />
                        </g>
                      </svg>
                    </div>
                    <div className="contact-item-link">
                      <span>{t("templates.contacts.viewLinkedin")}</span>
                      <svg
                        className="link-arrow"
                        viewBox="0 0 16 16"
                        fill="none"
                      >
                        <g>
                          <path
                            d="M13.2,2.7c-.2-.2-.4-.3-.7-.3h-7c-.5,0-.9.5-.9,1,0,.5.4.9.9,1h.1s4.5,0,4.5,0l-7.6,7.6c-.4.4-.4,1,0,1.4.4.4,1,.4,1.4,0l7.6-7.6v4.4c0,.6.4,1,1,1,.6,0,1-.4,1-1V3.4c0-.3-.1-.5-.3-.7Z"
                            fill="var(--mainColor)"
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
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 16 16"
                        fill="none"
                      >
                        <g>
                          <path
                            className="cls-1"
                            d="M8.4,1h-.4c-3.9,0-7,3.1-7,7v.4c.2,3.6,3.1,6.5,6.6,6.6h.4c3.7,0,6.8-2.9,7-6.6v-.4c0-3.7-2.9-6.8-6.6-7ZM8,13c-2.8,0-5-2.2-5-5s0,0,0,0c0,2.8,2.2,5,5,5h0ZM8,13v-1.7l-.8-1.3h-1.3v-1.3l-1.3-.8h-1.7c0-2.8,2.2-5,5-5s.3,0,.4,0v1.6l-2.1.8v1.3l1.3,1.3h1.7l.4.4.4.8h1.3v-1.3l1.6-.3c0,.1,0,.2,0,.3,0,2.8-2.2,5-5,5Z"
                            fill="var(--mainColor)"
                          />
                        </g>
                      </svg>
                    </div>
                    <div className="contact-item-link">
                      <span>View my website</span>
                      <svg
                        className="link-arrow"
                        viewBox="0 0 16 16"
                        fill="none"
                      >
                        <g>
                          <path
                            d="M13.2,2.7c-.2-.2-.4-.3-.7-.3h-7c-.5,0-.9.5-.9,1,0,.5.4.9.9,1h.1s4.5,0,4.5,0l-7.6,7.6c-.4.4-.4,1,0,1.4.4.4,1,.4,1.4,0l7.6-7.6v4.4c0,.6.4,1,1,1,.6,0,1-.4,1-1V3.4c0-.3-.1-.5-.3-.7Z"
                            fill="var(--mainColor)"
                          />
                        </g>
                      </svg>
                    </div>
                  </a>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Content area */}
        <main className="content">
          {/* Experience Section */}
          {(!isPublished || !isSectionEmpty(data.experience)) && (
            <section className="experience">
              <span className="section-title"><Icons.HiOutlineBriefcase size={20} />{t("templates.sections.experience")}</span>
            {data.experience && data.experience.length > 0 ? (
              data.experience.map((exp) => (
                <div key={exp.id} className="experience-item">
                  <div className="exp-left">
                    <h4 className="position">
                      {exp.position || t("templates.fields.jobTitle")}
                    </h4>
                    <div className="exp-details">
                      <span className="placename">
                        {exp.company || t("templates.fields.company")}
                      </span>
                      <br />
                      <span className="dates">
                        {formatDateRange(
                          exp.from ||
                            (exp.startMonth && exp.startYear
                              ? `${exp.startMonth}/${exp.startYear}`
                              : ""),
                          exp.to ||
                            (exp.endMonth && exp.endYear
                              ? `${exp.endMonth}/${exp.endYear}`
                              : ""),
                          exp.current || exp.isCurrent,
                        )}
                      </span>
                      <br />
                      <span className="location">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M12.2158 1.5C16.3988 1.5 19.8827 4.70822 20.2266 8.87695C20.4116 11.1215 19.7186 13.3512 18.293 15.0947L13.5 20.9561C12.7251 21.9038 11.276 21.9037 10.501 20.9561L5.70801 15.0947C4.28235 13.3512 3.58842 11.1215 3.77344 8.87695C4.11727 4.70821 7.60124 1.5 11.7842 1.5H12.2158ZM12 6.75C10.2051 6.75005 8.75 8.2051 8.75 10C8.75 11.7949 10.2051 13.25 12 13.25C13.7949 13.25 15.25 11.7949 15.25 10C15.25 8.20507 13.7949 6.75 12 6.75Z"
                            fill="currentColor"
                          />
                        </svg>
                        {exp.location || t("templates.fields.location")}
                      </span>
                    </div>
                  </div>
                  <div className="exp-right">
                    <div className="description">
                      {exp.summary || exp.description ? (
                        renderHTMLContent(exp.summary || exp.description || "")
                      ) : (
                        <p>
                          Responsible for various missions within the company.
                          Collaboration with internal and external teams...
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="experience-item">
                <div className="exp-left">
                  <h4 className="position">Job title</h4>
                  <div className="exp-details">
                    <span className="placename">Company name</span>
                    <br />
                    <span className="dates">Juin 2022 — Présent</span>
                    <br />
                    <span className="location">Ville, Pays</span>
                  </div>
                </div>
                <div className="exp-right">
                  <div className="description">
                    <p>
                      Responsable de diverses missions au sein de l'entreprise.
                      Collaboration avec les équipes internes et externes...
                    </p>
                  </div>
                </div>
              </div>
            )}
            </section>
          )}

          {/* Education Section */}
          {(!isPublished || !isSectionEmpty(data.education)) && (
            <section className="education">
              <span className="section-title"><Icons.HiOutlineAcademicCap size={20} />{t("templates.sections.education")}</span>
            {data.education && data.education.length > 0 ? (
              data.education.map((edu) => (
                <div key={edu.id} className="education-item">
                  <div className="edu-left">
                    <div className="position">{edu.diploma}</div>
                    <div className="edu-details">
                      {edu.school && (
                        <>
                          <span className="placename">{edu.school}</span>
                          <br />
                        </>
                      )}
                      <span className="dates">
                        {formatDate(
                          edu.from ||
                            (edu.startMonth && edu.startYear
                              ? `${edu.startMonth}/${edu.startYear}`
                              : ""),
                        )}{" "}
                        —{" "}
                        {formatDate(
                          edu.to ||
                            (edu.endMonth && edu.endYear
                              ? `${edu.endMonth}/${edu.endYear}`
                              : ""),
                        )}
                      </span>
                      {edu.location && (
                        <>
                          <br />
                          <span className="location">
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <path
                                d="M12.2158 1.5C16.3988 1.5 19.8827 4.70822 20.2266 8.87695C20.4116 11.1215 19.7186 13.3512 18.293 15.0947L13.5 20.9561C12.7251 21.9038 11.276 21.9037 10.501 20.9561L5.70801 15.0947C4.28235 13.3512 3.58842 11.1215 3.77344 8.87695C4.11727 4.70821 7.60124 1.5 11.7842 1.5H12.2158ZM12 6.75C10.2051 6.75005 8.75 8.2051 8.75 10C8.75 11.7949 10.2051 13.25 12 13.25C13.7949 13.25 15.25 11.7949 15.25 10C13.7949 6.75 12 6.75Z"
                                fill="currentColor"
                              />
                            </svg>
                            {edu.location}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="edu-right">
                    <div className="description">
                      {edu.description ? (
                        renderHTMLContent(edu.description)
                      ) : (
                        <p>
                          Comprehensive education in the field of study.
                          Acquisition of theoretical and practical skills
                          essential for professional development.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="education-item">
                <div className="edu-left">
                  <div className="position">Degree</div>
                  <div className="edu-details">
                    <span className="placename">School / University</span>
                    <br />
                    <span className="dates">— </span>
                    <br />
                    <span className="location">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M12.2158 1.5C16.3988 1.5 19.8827 4.70822 20.2266 8.87695C20.4116 11.1215 19.7186 13.3512 18.293 15.0947L13.5 20.9561C12.7251 21.9038 11.276 21.9037 10.501 20.9561L5.70801 15.0947C4.28235 13.3512 3.58842 11.1215 3.77344 8.87695C4.11727 4.70821 7.60124 1.5 11.7842 1.5H12.2158ZM12 6.75C10.2051 6.75005 8.75 8.2051 8.75 10C8.75 11.7949 10.2051 13.25 12 13.25C13.7949 13.25 15.25 11.7949 15.25 10C15.25 8.20507 13.7949 6.75 12 6.75Z"
                          fill="currentColor"
                        />
                      </svg>
                      City, Country
                    </span>
                  </div>
                </div>
                <div className="edu-right">
                  <div className="description">
                    <p>
                      Comprehensive education in the field of study. Acquisition
                      of theoretical and practical skills essential for
                      professional development.
                    </p>
                  </div>
                </div>
              </div>
            )}
            </section>
          )}

          {/* Certifications Section */}
          {data.certifications && data.certifications.length > 0 && (
            <section className="certifications">
              <span className="section-title"><Icons.HiOutlineCheckBadge size={20} />Certifications</span>
              {data.certifications.map((cert) => (
                <div key={cert.id} className="certification-item">
                  <div className="cert-left">
                    <div className="position">{cert.name}</div>
                    <div className="cert-details">
                      <span className="placename">{cert.issuer}</span>
                      <br />
                      <span className="dates">{formatDate(cert.date)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </section>
          )}
        </main>
      </div>

      {/* Séparateur */}
      <div className="separator"></div>

      {/* Bottom content - Layout dynamique avec logique 3 colonnes */}
      <div className="container bottom-content">
        {/* Colonne 1: Languages - toujours présente */}
        {(!isPublished || !isSectionEmpty(data.languages)) && data.languages && data.languages.length > 0 && data.languages.some(lang => lang.name && lang.name.trim() !== '') && (
          <div
            className={
              // Si hobbies OU outils: 1/3, sinon: 1/2 (langues + compétences seulement)
              (data.hobbies && data.hobbies.length > 0) ||
              (data.tools && data.tools.length > 0)
                ? "bottom-third"
                : "bottom-left"
            }
          >
            <span className="section-title"><Icons.HiLanguage size={20} />{t("templates.sections.languages")}</span>
            <ul className="languages-list">
              {data.languages.filter(lang => lang.name && lang.name.trim() !== '').map((lang) => (
                <li key={lang.id}>
                  <span className="language-name">{lang.name}</span>
                  {!hideLanguageLevels && (
                    <span className="language-level">
                      {getLanguageLevelLabel(
                        normalizeLanguageLevel(lang.level || "intermediate"),
                        language
                      )}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Colonne 2: Skills + Tools (si hobbies présents) */}
        {(!isPublished || !isSectionEmpty(data.skills)) && (
          <div
            className={
              // Si hobbies présents: 1/3, sinon si outils: 1/3, sinon: 2/3
              data.hobbies && data.hobbies.length > 0
                ? "bottom-third"
                : data.tools && data.tools.length > 0
                  ? "bottom-third"
                  : "bottom-right"
            }
          >
            <span className="section-title"><Icons.HiOutlineBolt size={20} />{t("templates.sections.skills")}</span>
          <div className="skills-container">
            {data.skills && data.skills.length > 0 ? (
              !hideSkillLevels ? (
                data.skills.map((skill) => (
                  <div key={skill.id} className="skill-item">
                    <span className="skill-name-with-level">{skill.name}</span>
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
                  </div>
                ))
              ) : (
                <div className="skills-horizontal">
                  {data.skills.map((skill) => (
                    <span key={skill.id} className="skill-name-only">
                      {skill.name}
                    </span>
                  ))}
                </div>
              )
            ) : (
              <>
                <span className="skill-name">
                  Budget Management & Forecasting
                </span>
                <span className="skill-name">
                  Timeline Development & Execution
                </span>
                <span className="skill-name">
                  Vendor & Contract Negotiation
                </span>
                <span className="skill-name">
                  On-Site Production Management
                </span>
              </>
            )}
          </div>

          {/* Tools - sous les compétences si hobbies présents */}
          {data.hobbies &&
            data.hobbies.length > 0 &&
            data.tools &&
            data.tools.length > 0 && (
              <div className="tools-section">
                <span className="section-title"><Icons.HiOutlineLightBulb size={20} />Tools</span>
                <div className="skills-container">
                  {!hideToolLevels ? (
                    data.tools.map((tool) => (
                      <div key={tool.id} className="skill-item">
                        <span className="skill-name-with-level">
                          {tool.name}
                        </span>
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
                      </div>
                    ))
                  ) : (
                    <div className="skills-horizontal">
                      {data.tools.map((tool) => (
                        <span key={tool.id} className="skill-name-only">
                          {tool.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Colonne 3: Tools (si pas de hobbies) OU Hobbies (si présents) */}
        {data.hobbies && data.hobbies.length > 0 ? (
          // Hobbies prennent la 3ème colonne
          <div className="bottom-third">
            <span className="section-title"><Icons.HiOutlineFaceSmile size={20} />Hobbies</span>
            <div className="hobbies-container">
              {data.hobbies.map((hobby) => (
                <div key={hobby.id} className="hobby-item">
                  {hobby.name}
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Tools prennent la 3ème colonne (seulement si pas de hobbies)
          data.tools &&
          data.tools.length > 0 && (
            <div className="bottom-third">
              <span className="section-title"><Icons.HiOutlineLightBulb size={20} />Tools</span>
              <div className="skills-container">
                {!hideToolLevels ? (
                  data.tools.map((tool) => (
                    <div key={tool.id} className="skill-item">
                      <span className="skill-name-with-level">{tool.name}</span>
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
                    </div>
                  ))
                ) : (
                  <div className="skills-horizontal">
                    {data.tools.map((tool) => (
                      <span key={tool.id} className="skill-name-only">
                        {tool.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        )}
      </div>

      {/* Footer unifié avec PDF et Brevy */}
      <CVFooter
        cvData={data}
        templateId="template-datalover"
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

export default TemplateDatalover;
