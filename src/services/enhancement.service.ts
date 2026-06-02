/**
 * Service for AI Description Enhancement
 * Calls the description enhancement API to refine user input into professional descriptions
 */

import { tokenService } from './token.service'

export interface EnhanceDescriptionPayload {
  product_name: string
  description: string
}

export interface EnhanceDescriptionResponse {
  enhanced_description: string
}

export const enhancementService = {
  /**
   * Enhances a project description using AI
   * @param productName - The project name
   * @param description - The current description text
   * @returns The enhanced description string
   */
  async enhanceDescription(
    productName: string,
    description: string,
  ): Promise<string> {
    const token = await tokenService.getToken()

    const headers: Record<string, string> = {
      accept: 'application/json',
      'Content-Type': 'application/json',
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/enhance-description`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          product_name: productName,
          description: description,
        }),
      },
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        errorData.message || `Enhancement failed: ${response.status}`,
      )
    }

    const data: EnhanceDescriptionResponse = await response.json()
    return data.enhanced_description
  },
}
