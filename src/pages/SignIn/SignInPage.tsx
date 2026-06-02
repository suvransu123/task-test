import React from 'react'
import { LoginLayout } from '../../components/LoginLayout'
import { LoginLeftContent } from './LoginLeftContent'
import { LoginRightContent } from './LoginRightContent'

export const SignInPage: React.FC = () => {
  return (
    <LoginLayout
      leftContent={<LoginLeftContent />}
      rightContent={<LoginRightContent />}
    />
  )
}
