import React from 'react';
import { Mail, Phone, MapPin, Globe, Linkedin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContactInfoProps {
  email?: string;
  phone?: string;
  location?: string;
  website?: string;
  linkedin?: string;
  className?: string;
  iconSize?: 'sm' | 'md' | 'lg';
  showIcons?: boolean;
}

const iconSizes = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5'
};

export const ContactInfo: React.FC<ContactInfoProps> = ({
  email,
  phone,
  location,
  website,
  linkedin,
  className,
  iconSize = 'md',
  showIcons = true
}) => {
  const contactItems = [
    { icon: Mail, value: email, href: email ? `mailto:${email}` : undefined },
    { icon: Phone, value: phone, href: phone ? `tel:${phone}` : undefined },
    { icon: MapPin, value: location },
    { icon: Globe, value: website, href: website },
    { icon: Linkedin, value: linkedin, href: linkedin }
  ].filter(item => item.value);

  if (contactItems.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-4 text-sm", className)}>
      {contactItems.map((item, index) => {
        const Icon = item.icon;
        const content = (
          <div className="flex items-center gap-2">
            {showIcons && <Icon className={iconSizes[iconSize]} />}
            <span>{item.value}</span>
          </div>
        );

        return item.href ? (
          <a
            key={index}
            href={item.href}
            className="hover:opacity-80 transition-opacity"
            target={item.href.startsWith('http') ? '_blank' : undefined}
            rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
          >
            {content}
          </a>
        ) : (
          <div key={index}>
            {content}
          </div>
        );
      })}
    </div>
  );
};
