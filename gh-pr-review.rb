class GhPrReview < Formula
  desc "Terminal-based GitHub PR review tool"
  homepage "https://github.com/krshrimali/gh-pr-review"
  url "https://github.com/krshrimali/gh-pr-review/archive/v1.0.0.tar.gz"
  sha256 "REPLACE_WITH_ACTUAL_SHA256"
  license "ISC"
  
  depends_on "node@18"
  
  def install
    system "npm", "install", *Language::Node.std_npm_install_args(libexec)
    bin.install_symlink Dir["#{libexec}/bin/*"]
  end
  
  test do
    assert_match "GitHub PR Review CLI", shell_output("#{bin}/gh-pr-review --help")
  end
end