const EcosystemCard = () => (
  <div className="sm:rounded-2xl overflow-hidden mb-16">
    <div className="about-ecosystem-card-content">
      <div className="about-ecosystem-card">
        <div className="relative z-10">
          <h2
            className="font-gilroy font-bold text-center text-white"
            style={{ fontSize: '24px', lineHeight: '133%' }}
          >
            How TrustVC Powers Multiple Ecosystems
          </h2>
          <p
            className="font-avenir text-center mt-1"
            style={{
              fontSize: '14px',
              fontWeight: 500,
              lineHeight: '155%',
              color: '#FFFFFF',
            }}
          >
            One foundational platform, unlimited verification possibilities.
          </p>
          <img
            src="/images/about/center-image.svg"
            alt="How TrustVC Powers Multiple Ecosystems"
            className="w-full block mt-4"
          />
        </div>
      </div>
    </div>
  </div>
)

export default EcosystemCard
