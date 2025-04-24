import React from 'react';
import '../styles/DonationPage.css';

const DonationPage = () => {
  const handlePayPalDonation = () => {
    window.open('https://www.paypal.com/donate/?business=marina.bennett.wyss%40gmail.com&no_recurring=0&item_name=Support+Group+Travel+AI+-+Help+us+keep+this+service+free+for+everyone%21&currency_code=USD', '_blank');
  };

  return (
    <div className="donation-page">
      <div className="donation-container">
        <div className="donation-header">
          <h1>Support Group Travel AI</h1>
          <p className="subtitle">Help us keep travel planning magical & free ✨</p>
        </div>

        <div className="donation-card">
          <div className="coffee-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8H19C20.0609 8 21.0783 8.42143 21.8284 9.17157C22.5786 9.92172 23 10.9391 23 12C23 13.0609 22.5786 14.0783 21.8284 14.8284C21.0783 15.5786 20.0609 16 19 16H18M18 8H2V17C2 18.0609 2.42143 19.0783 3.17157 19.8284C3.92172 20.5786 4.93913 21 6 21H14C15.0609 21 16.0783 20.5786 16.8284 19.8284C17.5786 19.0783 18 18.0609 18 17V8Z" />
            </svg>
          </div>
          
          <div className="donation-text">
            <p>We're committed to keeping Group Travel AI completely free for everyone. Your support helps us cover essential costs like:</p>
            <ul className="features-list costs">
              <li>🤖 AI API costs for smart recommendations</li>
              <li>☁️ Cloud hosting and servers</li>
              <li>🔒 Security and data protection</li>
              <li>🛠️ Development of new features</li>
            </ul>
            <p className="support-message">Even a small donation helps us maintain and improve this free service for the entire travel community!</p>
          </div>

          <button className="donate-button" onClick={handlePayPalDonation}>
            <img 
              src="https://www.paypalobjects.com/webstatic/mktg/Logo/pp-logo-100px.png" 
              alt="PayPal Logo" 
              className="paypal-logo"
            />
            Support with PayPal
          </button>
        </div>

        <div className="thank-you-note">
          <p>Thank you for your support! 💙</p>
          <p className="small-text">Your contribution helps keep group travel planning free for everyone</p>
        </div>
      </div>
    </div>
  );
};

export default DonationPage; 