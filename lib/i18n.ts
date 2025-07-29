import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
// @ts-expect-error - react-i18next types issue
import { initReactI18next } from 'react-i18next';

// Import translation resources directly
const resources = {
  en: {
    common: {
      "navigation": {
        "dashboard": "Dashboard",
        "interview": "Interview",
        "history": "History",
        "settings": "Settings",
        "profile": "Profile",
        "feedback": "Feedback"
      },
      "auth": {
        "welcomeBack": "Welcome back",
        "signInContinue": "Sign in to continue your interview prep",
        "email": "Email",
        "password": "Password",
        "forgotPassword": "Forgot your password?",
        "signIn": "Sign In",
        "signUp": "Sign Up",
        "dontHaveAccount": "Don't have an account?",
        "alreadyHaveAccount": "Already have an account?",
        "createAccount": "Create your account",
        "getStartedToday": "Get started with interview prep today",
        "fullName": "Full Name",
        "confirmPassword": "Confirm Password",
        "signOut": "Sign Out"
      },
      "settings": {
        "title": "Settings",
        "description": "Customize your interview preparation experience",
        "interviewerVoice": "Interviewer Voice",
        "interviewerGender": "Interviewer Gender",
        "voiceSpeed": "Voice Speed",
        "slow": "Slow",
        "normal": "Normal",
        "fast": "Fast",
        "interviewPreferences": "Interview Preferences",
        "difficultyPreference": "Difficulty Preference",
        "adaptive": "Adaptive (Recommended)",
        "easy": "Easy",
        "medium": "Medium",
        "hard": "Hard",
        "adaptiveDescription": "Adaptive adjusts difficulty based on your performance",
        "feedbackDetailLevel": "Feedback Detail Level",
        "brief": "Brief",
        "detailed": "Detailed (Recommended)",
        "comprehensive": "Comprehensive",
        "interfaceSettings": "Interface Settings",
        "theme": "Theme",
        "light": "Light",
        "dark": "Dark",
        "language": "Language",
        "features": "Features",
        "autoSaveAnswers": "Auto-save answers as you type",
        "showQuestionTimer": "Show question timer during interviews",
        "saveSettings": "Save Settings",
        "saving": "Saving...",
        "settingsSaved": "Settings saved successfully!",
        "settingsError": "Error saving settings. Please try again.",
        "genderOptions": {
          "neutral": "Neutral",
          "male": "Male",
          "female": "Female"
        }
      },
      "dashboard": {
        "title": "Dashboard",
        "welcomeBack": "Welcome back",
        "recentInterviews": "Recent Interviews",
        "startNewInterview": "Start New Interview",
        "viewHistory": "View History",
        "practiceToday": "Practice Today",
        "improvementAreas": "Areas for Improvement",
        "strengthAreas": "Your Strengths",
        "noInterviews": "No interviews yet",
        "getStarted": "Get started by taking your first interview"
      },
      "interview": {
        "title": "Interview",
        "startInterview": "Start Interview",
        "endInterview": "End Interview",
        "nextQuestion": "Next Question",
        "previousQuestion": "Previous Question",
        "timeRemaining": "Time Remaining",
        "question": "Question",
        "yourAnswer": "Your Answer",
        "submitAnswer": "Submit Answer",
        "loading": "Loading...",
        "preparingQuestion": "Preparing your next question...",
        "interviewComplete": "Interview Complete",
        "reviewFeedback": "Review Feedback",
        "selectTemplate": "Select Interview Template",
        "chooseTemplate": "Choose a template to start your interview",
        "difficulty": "Difficulty",
        "duration": "Duration",
        "questions": "Questions"
      },
      "profile": {
        "title": "Profile",
        "description": "Manage your account information and settings",
        "accountInformation": "Account Information",
        "personalInformation": "Personal Information",
        "updateProfile": "Update Profile",
        "profileUpdated": "Profile updated successfully!",
        "name": "Name",
        "email": "Email",
        "emailAddress": "Email Address",
        "fullName": "Full Name",
        "enterFullName": "Enter your full name",
        "memberSince": "Member since",
        "accountSettings": "Account Settings",
        "noNameSet": "No name set",
        "emailManagedMessage": "Your email is managed by your authentication provider",
        "autoSaveMessage": "Changes are automatically saved",
        "saving": "Saving...",
        "errorLoadingTitle": "Unable to Load Profile",
        "errorLoadingMessage": "There was an error loading your profile information. Please try refreshing the page."
      },
      "history": {
        "title": "Interview History",
        "noInterviews": "No interviews yet",
        "startFirstInterview": "Start your first interview to see history here",
        "viewDetails": "View Details",
        "score": "Score",
        "duration": "Duration",
        "questions": "Questions",
        "completed": "Completed",
        "inProgress": "In Progress",
        "date": "Date",
        "template": "Template",
        "performance": "Performance"
      },
      "feedback": {
        "title": "Interview Feedback",
        "overallScore": "Overall Score",
        "strengths": "Strengths",
        "improvements": "Areas for Improvement",
        "detailed": "Detailed Feedback",
        "summary": "Summary",
        "recommendations": "Recommendations",
        "nextSteps": "Next Steps",
        "retakeInterview": "Retake Interview",
        "backToHistory": "Back to History"
      },
      "templates": {
        "title": "Interview Templates",
        "subtitle": "Choose Your Interview Type",
        "selectTemplate": "Select a Template",
        "company": "Company",
        "role": "Role",
        "level": "Level",
        "topic": "Topic",
        "customize": "Customize",
        "startInterview": "Start Interview"
      },
      "common": {
        "loading": "Loading...",
        "error": "Error",
        "success": "Success",
        "cancel": "Cancel",
        "save": "Save",
        "delete": "Delete",
        "edit": "Edit",
        "view": "View",
        "back": "Back",
        "next": "Next",
        "previous": "Previous",
        "close": "Close",
        "confirm": "Confirm",
        "yes": "Yes",
        "no": "No"
      },
      "homepage": {
        "bestToolBadge": "Best Interview Prep Tool",
        "title": "AI-Powered Interview Prep",
        "subtitle": "That Works.",
        "description": "Practice real interview scenarios with our AI mock interviewer. Get personalized feedback and track your progress.",
        "startNow": "Start Now",
        "allFeatures": "All Features",
        "pricing": "Pricing",
        "previewSample": "Tell me about a challenging project you worked on and how you overcame obstacles...",
        "freeCard": {
          "title": "Free",
          "price": "$0",
          "period": "forever",
          "features": [
            "4 AI interview sessions per month",
            "Basic feedback analysis", 
            "Common interview questions",
            "Profile management"
          ],
          "cta": "Get Started"
        },
        "premiumCard": {
          "title": "Premium",
          "price": "$10",
          "period": "per month",
          "features": [
            "Unlimited AI interview sessions",
            "Advanced feedback & scoring",
            "Custom interview scenarios", 
            "Detailed performance analytics",
            "Priority support",
            "30-day money-back guarantee"
          ],
          "cta": "Get Premium Access"
        },
        "faq": {
          "title": "Frequently Asked Questions",
          "items": [
            {
              "question": "How does the AI mock interview work?",
              "answer": "Our AI simulates live interview conditions and adapts based on your responses, providing detailed feedback instantly."
            },
            {
              "question": "Can I practice for specific companies?", 
              "answer": "Yes! We have interview templates for major tech companies including Google, Amazon, Microsoft, and more."
            },
            {
              "question": "What types of questions are covered?",
              "answer": "We cover technical, behavioral, system design, and coding questions across all experience levels."
            },
            {
              "question": "How accurate is the AI feedback?",
              "answer": "Our AI is trained on thousands of real interviews and provides highly accurate, actionable feedback."
            }
          ]
        },
        "footer": {
          "description": "Empowering candidates to ace interviews with realistic simulations and AI-driven feedback.",
          "quickLinks": "Quick Links",
          "resources": "Resources",
          "contact": "Contact",
          "email": "support@sensei.com",
          "allRights": "All rights reserved.",
          "privacy": "Privacy Policy",
          "terms": "Terms of Service",
          "dashboard": "Dashboard",
          "interview": "Interview",
          "pricing": "Pricing",
          "faq": "FAQ",
          "blog": "Blog",
          "guides": "Guides"
        }
      },
      "languages": {
        "en": "English",
        "pl": "Polish"
      }
    }
  },
  pl: {
    common: {
      "navigation": {
        "dashboard": "Panel główny",
        "interview": "Rozmowa kwalifikacyjna",
        "history": "Historia",
        "settings": "Ustawienia",
        "profile": "Profil",
        "feedback": "Opinia"
      },
      "auth": {
        "welcomeBack": "Witamy ponownie",
        "signInContinue": "Zaloguj się, aby kontynuować przygotowania do rozmowy kwalifikacyjnej",
        "email": "Email",
        "password": "Hasło",
        "forgotPassword": "Zapomniałeś hasła?",
        "signIn": "Zaloguj się",
        "signUp": "Zarejestruj się",
        "dontHaveAccount": "Nie masz konta?",
        "alreadyHaveAccount": "Masz już konto?",
        "createAccount": "Utwórz swoje konto",
        "getStartedToday": "Zacznij przygotowania do rozmowy kwalifikacyjnej już dziś",
        "fullName": "Imię i nazwisko",
        "confirmPassword": "Potwierdź hasło",
        "signOut": "Wyloguj się"
      },
      "settings": {
        "title": "Ustawienia",
        "description": "Dostosuj swoje doświadczenie przygotowań do rozmowy kwalifikacyjnej",
        "interviewerVoice": "Głos rekrutera",
        "interviewerGender": "Płeć rekrutera",
        "voiceSpeed": "Prędkość głosu",
        "slow": "Wolno",
        "normal": "Normalnie",
        "fast": "Szybko",
        "interviewPreferences": "Preferencje rozmowy",
        "difficultyPreference": "Preferencja trudności",
        "adaptive": "Adaptacyjny (Zalecane)",
        "easy": "Łatwy",
        "medium": "Średni",
        "hard": "Trudny",
        "adaptiveDescription": "Tryb adaptacyjny dostosowuje trudność do Twojej wydajności",
        "feedbackDetailLevel": "Poziom szczegółowości opinii",
        "brief": "Krótko",
        "detailed": "Szczegółowo (Zalecane)",
        "comprehensive": "Kompleksowo",
        "interfaceSettings": "Ustawienia interfejsu",
        "theme": "Motyw",
        "light": "Jasny",
        "dark": "Ciemny",
        "language": "Język",
        "features": "Funkcje",
        "autoSaveAnswers": "Automatycznie zapisuj odpowiedzi podczas pisania",
        "showQuestionTimer": "Pokaż timer pytań podczas rozmów",
        "saveSettings": "Zapisz ustawienia",
        "saving": "Zapisywanie...",
        "settingsSaved": "Ustawienia zostały pomyślnie zapisane!",
        "settingsError": "Błąd podczas zapisywania ustawień. Spróbuj ponownie.",
        "genderOptions": {
          "neutral": "Neutralny",
          "male": "Mężczyzna",
          "female": "Kobieta"
        }
      },
      "dashboard": {
        "title": "Panel główny",
        "welcomeBack": "Witamy ponownie",
        "recentInterviews": "Ostatnie rozmowy",
        "startNewInterview": "Rozpocznij nową rozmowę",
        "viewHistory": "Zobacz historię",
        "practiceToday": "Ćwicz dzisiaj",
        "improvementAreas": "Obszary do poprawy",
        "strengthAreas": "Twoje mocne strony",
        "noInterviews": "Brak rozmów",
        "getStarted": "Zacznij od pierwszej rozmowy kwalifikacyjnej"
      },
      "interview": {
        "title": "Rozmowa kwalifikacyjna",
        "startInterview": "Rozpocznij rozmowę",
        "endInterview": "Zakończ rozmowę",
        "nextQuestion": "Następne pytanie",
        "previousQuestion": "Poprzednie pytanie",
        "timeRemaining": "Pozostały czas",
        "question": "Pytanie",
        "yourAnswer": "Twoja odpowiedź",
        "submitAnswer": "Prześlij odpowiedź",
        "loading": "Ładowanie...",
        "preparingQuestion": "Przygotowywanie następnego pytania...",
        "interviewComplete": "Rozmowa zakończona",
        "reviewFeedback": "Przejrzyj opinię",
        "selectTemplate": "Wybierz szablon rozmowy",
        "chooseTemplate": "Wybierz szablon, aby rozpocząć rozmowę",
        "difficulty": "Trudność",
        "duration": "Czas trwania",
        "questions": "Pytania"
      },
      "profile": {
        "title": "Profil",
        "description": "Zarządzaj informacjami o koncie i ustawieniami",
        "accountInformation": "Informacje o koncie",
        "personalInformation": "Informacje osobiste",
        "updateProfile": "Aktualizuj profil",
        "profileUpdated": "Profil został pomyślnie zaktualizowany!",
        "name": "Imię",
        "email": "Email",
        "emailAddress": "Adres email",
        "fullName": "Pełne imię i nazwisko",
        "enterFullName": "Wprowadź swoje pełne imię i nazwisko",
        "memberSince": "Członek od",
        "accountSettings": "Ustawienia konta",
        "noNameSet": "Nie ustawiono imienia",
        "emailManagedMessage": "Twój email jest zarządzany przez dostawcę uwierzytelniania",
        "autoSaveMessage": "Zmiany są automatycznie zapisywane",
        "saving": "Zapisywanie...",
        "errorLoadingTitle": "Nie można załadować profilu",
        "errorLoadingMessage": "Wystąpił błąd podczas ładowania informacji o profilu. Spróbuj odświeżyć stronę."
      },
      "history": {
        "title": "Historia rozmów",
        "noInterviews": "Brak rozmów",
        "startFirstInterview": "Rozpocznij pierwszą rozmowę, aby zobaczyć historię",
        "viewDetails": "Zobacz szczegóły",
        "score": "Wynik",
        "duration": "Czas trwania",
        "questions": "Pytania",
        "completed": "Zakończone",
        "inProgress": "W trakcie",
        "date": "Data",
        "template": "Szablon",
        "performance": "Wydajność"
      },
      "feedback": {
        "title": "Opinia z rozmowy",
        "overallScore": "Ogólny wynik",
        "strengths": "Mocne strony",
        "improvements": "Obszary do poprawy",
        "detailed": "Szczegółowa opinia",
        "summary": "Podsumowanie",
        "recommendations": "Rekomendacje",
        "nextSteps": "Następne kroki",
        "retakeInterview": "Powtórz rozmowę",
        "backToHistory": "Powrót do historii"
      },
      "templates": {
        "title": "Szablony rozmów",
        "subtitle": "Wybierz typ rozmowy kwalifikacyjnej",
        "selectTemplate": "Wybierz szablon",
        "company": "Firma",
        "role": "Stanowisko",
        "level": "Poziom",
        "topic": "Temat",
        "customize": "Dostosuj",
        "startInterview": "Rozpocznij rozmowę"
      },
      "common": {
        "loading": "Ładowanie...",
        "error": "Błąd",
        "success": "Sukces",
        "cancel": "Anuluj",
        "save": "Zapisz",
        "delete": "Usuń",
        "edit": "Edytuj",
        "view": "Zobacz",
        "back": "Wstecz",
        "next": "Dalej",
        "previous": "Poprzedni",
        "close": "Zamknij",
        "confirm": "Potwierdź",
        "yes": "Tak",
        "no": "Nie"
      },
      "homepage": {
        "bestToolBadge": "Najlepsze narzędzie do przygotowań",
        "title": "Przygotowania do rozmów AI",
        "subtitle": "Które naprawdę działają.",
        "description": "Ćwicz rzeczywiste scenariusze rozmów z naszym rekruterem AI. Otrzymuj spersonalizowane opinie i śledź swoje postępy.",
        "startNow": "Zacznij teraz",
        "allFeatures": "Wszystkie funkcje",
        "pricing": "Cennik",
        "previewSample": "Opowiedz mi o trudnym projekcie, nad którym pracowałeś i jak pokonałeś przeszkody...",
        "freeCard": {
          "title": "Darmowy",
          "price": "0 zł",
          "period": "na zawsze",
          "features": [
            "4 sesje rozmów AI miesięcznie",
            "Podstawowa analiza opinii",
            "Podstawowe pytania rekrutacyjne", 
            "Zarządzanie profilem"
          ],
          "cta": "Rozpocznij"
        },
        "premiumCard": {
          "title": "Premium", 
          "price": "40 zł",
          "period": "miesięcznie",
          "features": [
            "Nieograniczone sesje rozmów AI",
            "Zaawansowane opinie i oceny",
            "Niestandardowe scenariusze rozmów",
            "Szczegółowa analityka wydajności", 
            "Wsparcie priorytetowe",
            "30-dniowa gwarancja zwrotu pieniędzy"
          ],
          "cta": "Uzyskaj dostęp Premium"
        },
        "faq": {
          "title": "Często zadawane pytania",
          "items": [
            {
              "question": "Jak działa symulowana rozmowa AI?",
              "answer": "Nasza AI symuluje warunki rzeczywistej rozmowy i dostosowuje się do Twoich odpowiedzi, zapewniając szczegółowe opinie natychmiastowo."
            },
            {
              "question": "Czy mogę ćwiczyć do konkretnych firm?",
              "answer": "Tak! Mamy szablony rozmów dla głównych firm technologicznych, w tym Google, Amazon, Microsoft i więcej."
            },
            {
              "question": "Jakie typy pytań są objęte?", 
              "answer": "Obejmujemy pytania techniczne, behawioralne, projektowania systemów i kodowania na wszystkich poziomach doświadczenia."
            },
            {
              "question": "Jak dokładne są opinie AI?",
              "answer": "Nasza AI jest wytrenowana na tysiącach rzeczywistych rozmów i zapewnia bardzo dokładne, praktyczne opinie."
            }
          ]
        },
        "footer": {
          "description": "Wspieramy kandydatów w osiąganiu sukcesu w rozmowach kwalifikacyjnych dzięki realistycznym symulacjom i opiniom napędzanym przez AI.",
          "quickLinks": "Szybkie linki",
          "resources": "Zasoby",
          "contact": "Kontakt",
          "email": "support@sensei.com",
          "allRights": "Wszelkie prawa zastrzeżone.",
          "privacy": "Polityka prywatności",
          "terms": "Warunki usługi",
          "dashboard": "Panel główny",
          "interview": "Rozmowa",
          "pricing": "Cennik",
          "faq": "FAQ",
          "blog": "Blog",
          "guides": "Przewodniki"
        }
      },
      "languages": {
        "en": "Angielski",
        "pl": "Polski"
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    
    // have a common namespace used around the full app
    defaultNS: 'common',
    ns: ['common'],

    keySeparator: '.',
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
  });

export default i18n;
