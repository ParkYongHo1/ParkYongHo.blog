# 배포주소
[ParkYongHo.blog](https://park-yong-ho-blog.vercel.app)

---

## 🧩 개요
Next.js + TypeScript + MDX 기반 개인 블로그 프로젝트입니다.  
개발 관련 글 등을 정리하며, 디자인과 기능을 커스터마이징했습니다.

---

## 🛠 기술 스택

- 프레임워크: Next.js

- 언어: TypeScript

- 마크다운: MDX

- 스타일링: Tailwind CSS 

- 배포: Vercel


## 🚀 주요 기능

<div style="display:flex; flex-wrap:wrap; gap:12px;">

<div style="background-color:#FEF3C7; padding:12px 16px; border-radius:12px; flex:1 1 200px;">
  <h3>📝 블로그 작성</h3>
  <p>MDX 기반으로 글 작성 및 관리 가능</p>
</div>

<div style="background-color:#D1FAE5; padding:12px 16px; border-radius:12px; flex:1 1 200px;">
  <h3>💻 코드 하이라이팅</h3>
  <p>개발 관련 코드 스니펫적용</p>
</div>

<div style="background-color:#BFDBFE; padding:12px 16px; border-radius:12px; flex:1 1 200px;">
  <h3>📱 반응형 레이아웃</h3>
  <p>모바일, 태블릿, 데스크톱 최적화</p>
</div>
<h3>🔍 SEO 최적화</h3> <p>robots.txt, sitemap.xml 설정 및 Google Search Console 연동으로 검색엔진 색인 강화</p> </div> <div style="background-color:#C7D2FE; padding:12px 16px; border-radius:12px; flex:1 1 200px;"> <h3>☁️ 서버리스 블로그 구조</h3> <p>GitHub API를 활용하여 서버 없이 콘텐츠 저장 및 커밋 자동화</p> </div> </div></div>

---

## 🧭 폴더 구조
```
/src – 컴포넌트 및 페이지 코드

/patches – MDX 및 콘텐츠 파일

/public – 정적 자산

next.config.ts – Next.js 설정

tsconfig.json – TypeScript 설정
```

## 기능설명

## ✏️ 포스트 작성 방법
- dev환경에서 `/write`경로에서 글작성 
- `/posts` 폴더에 MDX 파일 추가  
- 파일명: `YYYY-MM-DD-slug.mdx`  
- 작성 후 커밋 & 푸시하면 자동 배포
<img width="1554" height="909" alt="image" src="https://github.com/user-attachments/assets/808cd7c9-f641-4197-ad52-e0f96a5fc391" />

---

## ☁️ 서버리스 GitHub API 구조
- GitHub API를 활용하여 글, 이미지, 메타데이터를 GitHub 저장소에 커밋  
- Tree API를 사용하여 **여러 파일을 한 번의 커밋**으로 처리  
- 이미지 업로드와 글 작성 API 통합  
- 단일 커밋으로 글 등록 → Git 히스토리 간결 유지

---

## 🔍 SEO 최적화 상세
- robots.txt 및 sitemap.xml 자동 생성  
- OpenGraph 태그 적용  
- Google Search Console 연동 
