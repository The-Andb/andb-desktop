/**
 * Helper to generate Pull Request / Merge Request URLs for various Git providers
 */
export function generatePrUrl(remoteUrl: string, sourceBranch: string, targetBranch: string): string | null {
  if (!remoteUrl) return null

  try {
    // Basic normalization: remove .git and trailing slashes
    let cleanUrl = remoteUrl.trim().replace(/\.git$/, '').replace(/\/$/, '')

    // Convert SSH to HTTPS if needed (best effort)
    if (cleanUrl.startsWith('git@')) {
      cleanUrl = 'https://' + cleanUrl.substring(4).replace(':', '/')
    }

    const url = new URL(cleanUrl)
    const hostname = url.hostname.toLowerCase()

    // GitHub
    if (hostname.includes('github.com')) {
      // Pattern: https://github.com/owner/repo/compare/target...source
      return `${cleanUrl}/compare/${targetBranch}...${sourceBranch}`
    }

    // GitLab
    if (hostname.includes('gitlab.com')) {
      // Pattern: https://gitlab.com/owner/repo/-/merge_requests/new?merge_request[source_branch]=source&merge_request[target_branch]=target
      return `${cleanUrl}/-/merge_requests/new?merge_request[source_branch]=${sourceBranch}&merge_request[target_branch]=${targetBranch}`
    }

    // Bitbucket
    if (hostname.includes('bitbucket.org')) {
      // Pattern: https://bitbucket.org/owner/repo/pull-requests/new?source=source&dest=target
      return `${cleanUrl}/pull-requests/new?source=${sourceBranch}&dest=${targetBranch}`
    }

    // Default: Just return the project URL if we don't know the PR pattern
    return cleanUrl
  } catch (e) {
    console.error('Failed to generate PR URL', e)
    return null
  }
}
