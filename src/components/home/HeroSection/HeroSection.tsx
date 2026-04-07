import React from 'react'

interface HeroSectionProps {
  isDarkMode: boolean
}

const HeroSection: React.FC<HeroSectionProps> = ({ isDarkMode }) => {
  return (
    <div className={`hero-section ${isDarkMode ? 'dark-mode' : ''}`}>
      <div className="hero-content">
        <div className="hero-title-container">
          <div className="hero-title-line">
            <span>Simple,&nbsp;</span>
            <span className="hero-gradient-text">Trustworthy</span>
          </div>
          <div className="hero-title-line">
            <span>Verifiable&nbsp;</span>
            <span>Credentials</span>
          </div>
        </div>
        <p className="hero-description">
          One SDK, multiple verification systems. Instantly verify trade
          documents, academic certificates, and legal apostilles powered by
          decentralized ledger technology and open standards for digital trust.
        </p>
      </div>
    </div>
  )
}

export default HeroSection
