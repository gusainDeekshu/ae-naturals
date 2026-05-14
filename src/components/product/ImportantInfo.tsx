import React from 'react';
import { ProductExtra } from '@/types/product';

// ==========================================
// HELPER 1: TEXT FORMATTER (Bold text)
// ==========================================
const renderTextWithBold = (text: string) => {
  // Splits by **text** and renders the matched parts as <strong>
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-semibold text-gray-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
};

// ==========================================
// HELPER 2: CONTENT PARSER (Paragraphs & Bullets)
// ==========================================
export function formatContent(content: string) {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: string[] = [];

  const pushListToElements = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="list-disc pl-5 space-y-2 mt-2 mb-4 marker:text-gray-400">
          {currentList.map((item, i) => (
            <li key={i} className="text-gray-700 leading-relaxed pl-1">
              {renderTextWithBold(item)}
            </li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // Detect bullet points
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      currentList.push(trimmed.substring(2));
    } else {
      pushListToElements(); // Dump any accumulated list items first
      elements.push(
        <p key={`p-${index}`} className="text-gray-700 leading-relaxed mb-3 last:mb-0">
          {renderTextWithBold(trimmed)}
        </p>
      );
    }
  });
  
  pushListToElements(); // Catch any remaining list items at the end

  return <div className="text-sm">{elements}</div>;
}

// ==========================================
// HELPER 3: REUSABLE INFO BLOCK
// ==========================================
interface InfoBlockProps {
  title: string;
  content?: string;
}

const InfoBlock = ({ title, content }: InfoBlockProps) => {
  if (!content) return null;

  return (
    <div className="pb-2">
      <h3 className="text-base font-bold text-gray-900 tracking-tight mb-2">{title}</h3>
      <div className="text-gray-700">
        {formatContent(content)}
      </div>
    </div>
  );
};

// ==========================================
// MAIN COMPONENT
// ==========================================
export default function ImportantInfo({ extra }: { extra: ProductExtra }) {
  const hasContent = extra?.safetyInfo || extra?.ingredients || extra?.directions;
  
  if (!hasContent) return null;

  return (
    <section className="w-full my-8" aria-labelledby="important-info-heading">
      <h2 
        id="important-info-heading" 
        className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight mb-6"
      >
        Important Information
      </h2>

      <div className="space-y-6">
        
        {/* Render Blocks Sequentially */}
        <InfoBlock 
          title="Ingredients" 
          content={extra.ingredients} 
        />
        
        <InfoBlock 
          title="Directions to Use" 
          content={extra.directions} 
        />
        
        <InfoBlock 
          title="Safety Information" 
          content={extra.safetyInfo} 
        />

        {/* Disclaimer Box - Simple gray background, no borders */}
        <div className="bg-gray-50 rounded-xl p-5 sm:p-6 mt-4">
          <h4 className="font-bold text-gray-900 mb-2 text-sm uppercase tracking-wide">
            Legal Disclaimer
          </h4>
          <p className="text-xs leading-relaxed text-gray-500">
            Actual product packaging and materials may contain more and different information than what is shown on our app or website. We recommend that you do not rely solely on the information presented here and that you always read labels, warnings, and directions before using or consuming a product.
          </p>
        </div>

      </div>
    </section>
  );
}