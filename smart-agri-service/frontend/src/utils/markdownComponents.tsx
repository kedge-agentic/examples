import React from 'react'
import type { Components } from 'react-markdown'
import { PolicyRefLink } from '../components/PolicyRefLink'

export const policyMarkdownComponents: Components = {
  a: (props) => <PolicyRefLink {...props} />,
}
