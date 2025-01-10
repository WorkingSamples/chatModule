import React from 'react'

const AuthLayout = ({ children }) => {
  return (
    <div className="flex flex-col md:flex-row h-screen bg-blue-50">
      {/* Left Section */}
      <div className="md:flex-1 relative bg-gradient-to-br from-blue-500 to-blue-400 hidden md:block">
        <div className="absolute inset-0 bg-no-repeat bg-cover bg-center flex items-center justify-center">
          {/* Replace with the actual image */}
          <img
            src="https://cdn.create.vista.com/api/media/small/228885982/stock-photo-empty-pink-blue-speech-bubbles-blue-background"
            alt="Graduates"
            className="h-96 rounded-md object-cover"
          />
        </div>
      </div>

      {/* Right Section */}
      {children}
    </div>
  )
}

export default AuthLayout