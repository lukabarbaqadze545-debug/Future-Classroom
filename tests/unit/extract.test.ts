import { describe, expect, it } from "vitest";
import { htmlToMarkdown } from "@/lib/files/extract";

describe("Word text extraction", () => {
  it("keeps headings, paragraphs and list items", () => {
    const md = htmlToMarkdown("<h1>Title</h1><p>First <strong>bold</strong> text.</p><ul><li>One</li><li>Two</li></ul><h2>Part</h2><p>&nbsp;</p><p>Last</p>");
    expect(md).toBe("# Title\n\nFirst bold text.\n\n- One\n\n- Two\n\n## Part\n\nLast");
  });

  it("keeps < and > that are part of the text, such as code and comparisons", () => {
    const md = htmlToMarkdown("<p>#include &lt;iostream&gt;</p><p>if (a &lt; b &amp;&amp; c &gt; d) cout &lt;&lt; &quot;ok&quot;;</p><h2>Vector&lt;int&gt;</h2><p>after</p>");
    expect(md).toBe('#include <iostream>\n\nif (a < b && c > d) cout << "ok";\n\n## Vector<int>\n\nafter');
  });

  it("does not decode an entity twice", () => {
    expect(htmlToMarkdown("<p>&amp;lt; stays as the text &amp;lt;</p>")).toBe("&lt; stays as the text &lt;");
  });
});
