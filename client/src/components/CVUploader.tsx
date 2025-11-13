import { useState } from 'react';
import { Upload, FileText, Loader2, CheckCircle, XCircle, Frown } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface CVUploaderProps {
  onDataParsed: (data: any) => void;
}

// Fonction pour obtenir l'URL de base de l'API (même logique que les autres API)
function getApiBase() {
  if (typeof window === 'undefined') return '';
  const host = window.location.hostname;
  const isProd = host.endsWith('brevy.me');
  return isProd ? 'https://cvfolio.onrender.com' : '';
}

export function CVUploader({ onDataParsed }: CVUploaderProps) {
  const { t, language } = useLanguage();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'success' | 'error' | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Vérifier le type de fichier
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];

    if (!allowedTypes.includes(file.type)) {
      setUploadStatus('error');
      setErrorMessage(t('cvBuilder.cvUploader.errorFileType'));
      return;
    }

    // Vérifier la taille (5 MB max)
    if (file.size > 5 * 1024 * 1024) {
      setUploadStatus('error');
      setErrorMessage(t('cvBuilder.cvUploader.errorFileSize'));
      return;
    }

    setIsUploading(true);
    setUploadStatus(null);
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('cvFile', file);

      const response = await fetch(`${getApiBase()}/api/cv/parse-upload`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        setUploadStatus('success');
        onDataParsed(result.data);
      } else {
        setUploadStatus('error');
        setErrorMessage(result.error || t('cvBuilder.cvUploader.errorAnalysis'));
      }

    } catch (error) {
      setUploadStatus('error');
      setErrorMessage(t('cvBuilder.cvUploader.errorConnection'));
    } finally {
      setIsUploading(false);
    }
  };

  // Fonction pour réinitialiser l'état
  const handleRetry = () => {
    setUploadStatus(null);
    setErrorMessage('');
    // Réinitialiser l'input file
    const input = document.getElementById('cv-upload') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
  };

  return (
    <>
      {/* État initial */}
      {!uploadStatus && (
        <div className="upload-card initial-state">
          <div className="upload-icon">
            <FileText size={32} />
          </div>
          
          <h3>{language === 'fr' ? 'Importez un CV existant' : 'Start from your existing resume'}</h3>
          <p>{language === 'fr' 
            ? 'Nous extrairons les informations pour remplir automatiquement le formulaire ci-dessous. Veuillez le vérifier avant publication.' 
            : "We'll extract the information to auto-fill the form below. Review it before publishing."}
          </p>

          <label htmlFor="cv-upload" className="upload-button">
            {isUploading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>{t('cvBuilder.cvUploader.analyzing')}</span>
              </>
            ) : (
              <>
                <Upload size={20} />
                <span>{language === 'fr' ? 'Télécharger (.pdf, .doc)' : 'Upload file (.pdf, .doc)'}</span>
              </>
            )}
          </label>
          
          <input
            id="cv-upload"
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileUpload}
            disabled={isUploading}
            style={{ display: 'none' }}
          />
        </div>
      )}

      {/* État succès */}
      {uploadStatus === 'success' && (
        <div className="upload-card success-state">
          <div className="upload-icon">
            <CheckCircle size={32} />
          </div>
          
          <h3>{t('cvBuilder.cvUploader.successTitle')}</h3>
          <p>{t('cvBuilder.cvUploader.successDescription')}</p>
        </div>
      )}

      {/* État erreur */}
      {uploadStatus === 'error' && (
        <div className="upload-card error-state">
          <div className="upload-icon">
            <Frown size={32} />
          </div>
          
          <h3>{t('cvBuilder.cvUploader.errorTitle')}</h3>
          <p>{t('cvBuilder.cvUploader.errorDescription')}</p>

          <label htmlFor="cv-upload-retry" className="upload-button">
            <Upload size={20} />
            <span>{t('cvBuilder.cvUploader.retryButton')}</span>
          </label>
          
          <input
            id="cv-upload-retry"
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => {
              handleRetry();
              handleFileUpload(e);
            }}
            style={{ display: 'none' }}
          />
        </div>
      )}

      <style jsx>{`
        .upload-card {
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          text-align: center;
          color: white;
        }

        .upload-card.initial-state {
          background: linear-gradient(135deg, #004ED4 0%, #7E69C9 100%);
        }

        .upload-card.success-state {
          background: linear-gradient(135deg, #004ED4 0%, #7E69C9 100%);
        }

        .upload-card.error-state {
          background: linear-gradient(135deg, #004ED4 0%, #7E69C9 100%);
        }

        .upload-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          margin-bottom: 0.5rem;
        }

        .upload-icon svg {
          width: 32px;
          height: 32px;
        }

        h3 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        p {
          font-size: 0.95rem;
          opacity: 0.9;
          margin-bottom: 1.5rem;
        }

        .upload-button {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: white;
          color: #0E1830;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          transition: transform 0.2s;
          border: 1px solid #E5E7EB;
        }

        .upload-button:hover {
          transform: translateY(-2px);
        }

        .upload-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
