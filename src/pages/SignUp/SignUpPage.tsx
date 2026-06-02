import React from 'react'
import { LoginLayout } from '../../components/LoginLayout'
import { LoginLeftContent } from '../SignIn/LoginLeftContent'
import { SignUpRightContent } from '#/pages/SignUp/SignUpRightContent'

export const SignUpPage: React.FC = () => {
  return (
    <LoginLayout
      leftContent={<LoginLeftContent />}
      rightContent={<SignUpRightContent />}
    />
  )
}
