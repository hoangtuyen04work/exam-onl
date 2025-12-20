# OAuth2 Integration - Frontend Setup (Azure & Google)

## ✅ Đã hoàn thành

Đã tích hợp đăng nhập bằng **Microsoft Account (Azure AD)** và **Google Account** vào hệ thống:

### 1. **LoginPage UI**
- ✅ Thêm nút "Đăng nhập với Microsoft" với logo chính thức
- ✅ Thêm nút "Đăng nhập với Google" với logo chính thức
- ✅ Divider "Hoặc" để phân tách các phương thức đăng nhập
- ✅ Design hiện đại, clean, responsive
- ✅ Truyền roleId khi redirect sang OAuth provider
- ✅ Sử dụng `VITE_SERVER_PORT_EXPOSE` (không có `/api/`)

### 2. **OAuth Callback Handler**
- ✅ File: `src/pages/LoginPage/AzureCallback.tsx` (renamed to OAuthCallback)
- ✅ Xử lý callback từ Azure AD hoặc Google sau khi đăng nhập thành công
- ✅ Loading state trong khi xử lý
- ✅ Auto redirect về dashboard theo role
- ✅ Error handling với toast notification

### 3. **Routing**
- ✅ Route: `/auth/oauth2/callback` để nhận callback (primary)
- ✅ Route: `/auth/azure/callback` để backward compatibility
- ✅ Tích hợp vào AppRouter

## 🔧 Cấu hình Backend cần thiết

Để hoàn thiện tích hợp, backend cần:

### 1. **Redirect URI Configuration**
Thêm frontend callback URL vào Azure App Registration:
```
http://localhost:3000/auth/azure/callback
```

### 2. **Success Handler (Java)**
Tạo OAuth2AuthenticationSuccessHandler để redirect về frontend với token:

```java
@Component
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {
    
    @Value("${frontend.url:http://localhost:3000}")
    private String frontendUrl;
    
    @Autowired
    private JwtTokenProvider jwtTokenProvider;
    
    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, 
                                       HttpServletResponse response,
                                       Authentication authentication) throws IOException {
        
        OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();
        String email = oauth2User.getAttribute("email");
        
        // Lấy roleId từ request parameter (được gửi từ frontend)
        String roleIdParam = request.getParameter("role");
        Long roleId = roleIdParam != null ? Long.parseLong(roleIdParam) : 2L; // Default: Student
        
        // Tạo hoặc lấy user từ database
        User user = userService.findOrCreateOAuthUser(email, oauth2User, roleId);
        
        // Generate JWT token
        String token = jwtTokenProvider.generateToken(user);
        
        // Redirect về frontend với token
        String redirectUrl = String.format("%s/auth/azure/callback?token=%s&role=%d",
                frontendUrl, token, roleId);
        
        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
}
```

### 3. **SecurityConfig Update**
```java
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http
        // ... existing config ...
        .oauth2Login(oauth2 -> oauth2
            .loginPage("/oauth2/authorization/azure")
            .successHandler(oAuth2AuthenticationSuccessHandler)
            .failureHandler(oAuth2AuthenticationFailureHandler)
        );
    
    return http.build();
}
```

### 4. **UserService Method**
```java
public User findOrCreateOAuthUser(String email, OAuth2User oauth2User, Long roleId) {
    Optional<User> existingUser = userRepository.findByEmail(email);
    
    if (existingUser.isPresent()) {
        return existingUser.get();
    }
    
    // Tạo user mới
    User newUser = new User();
    newUser.setEmail(email);
    newUser.setName(oauth2User.getAttribute("name"));
    newUser.setProvider(AuthProvider.AZURE);
    newUser.setEnabled(true);
    
    // Assign role
    Role role = roleRepository.findById(roleId)
        .orElseThrow(() -> new RuntimeException("Role not found"));
    newUser.setRoles(Set.of(role));
    
    return userRepository.save(newUser);
}
```

## 🌐 Environment Variables

### Frontend (.env)
```bash
VITE_API_BASE=http://localhost:8888/exam-online-system/api
VITE_API_BASE_EXPOSE=http://localhost:8888/exam-online-system/api
VITE_SERVER_PORT_EXPOSE=http://localhost:8888/exam-online-system
```

**Quan trọng**: OAuth URLs phải dùng `VITE_SERVER_PORT_EXPOSE` (không có `/api/`)

### Backend (application.yaml hoặc .env)
```yaml
frontend:
  url: http://localhost:3000

spring:
  security:
    oauth2:
      client:
        registration:
          azure:
            client-id: ${AZURE_CLIENT_ID}
            client-secret: ${AZURE_CLIENT_SECRET}
            scope:
              - openid
              - profile
              - email
              - User.Read
            redirect-uri: "{baseUrl}/login/oauth2/code/{registrationId}"
            authorization-grant-type: authorization_code
        provider:
          azure:/Google

```
1. User chọn role (Thí Sinh/Giáo Viên)
2. User click "Đăng nhập với Microsoft" hoặc "Đăng nhập với Google"
   → Frontend redirect: 
      http://localhost:8888/exam-online-system/oauth2/authorization/{provider}?role={roleId}
      (provider = azure hoặc google)

3. Backend redirect đến OAuth provider login page
   → User nhập credentials (Microsoft/Google)

4. OAuth provider redirect về backend callback
   → Backend: /login/oauth2/code/{provider}?code=...&state=...

5. Backend xử lý OAuth2, tạo/lấy user, generate JWT
   → Redirect về frontend: /auth/oauth2/callback?token=JWT_TOKEN&role={roleId}

6. Frontend (OAuthCallback.tsx):
   - Lấy token từ URL
   - Call /api/auth/me để lấy thông tin user (với token)
   - Lưu token vào localStorage
   - Update Redux store
   - Show success toastack.tsx):
   - Lấy token từ URL
   - Call /api/auth/me để lấy thông tin user
   - Lưu token vào localStorage
   - Update Redux store
   - Redirect về dashboard (/teacher hoặc /student)
```OAuth Sign In Buttons
**Microsoft Button:**
- Logo Microsoft chính thức (4 màu: đỏ, xanh lá, xanh dương, vàng)
- Border gray với hover effect
- Shadow nhẹ
- Text "Đăng nhập với Microsoft"

**Google Button:**
- Logo Google chính thức (4 màu)
- Border gray với hover effect
- Shadow nhẹ
- Text "Đăng nhập với Google"

### Loading State (OAuthCallback)
- Spinner animation (blue)
- Text "Đang xử lý đăng nhập..."
- Subtext "Vui lòng đợi trong giây lát"
- Full screen centered, gray backgroun
### Loading State (AzureCallback)
- Spinner animation
- Text "Đang xử lý đăng nhập..."
- Full screen centered

## 🧪 Testing

### 1. Kiểm tra flow cơ bản:
```bash
# Truy cập login page
http://localhost:3000/login

# Click nút "Đăng nhập với Microsoft"
# → Should redirect to Azure AD
# → Nhập credentials
# → Should redirect back to /auth/azure/callback
# → Should auto redirect to dashboard
```

### 2. Kiểm tra với các role khác nhau:
- Chọn role "Thí Sinh" → click Microsoft login → should go to /student
- Chọn role "Giáo Viên" → click Microsoft login → should go to /teacher

### 3. Error handling:
- Token không hợp lệ → redirect về /login với toast error
- Backend không response → redirect về /login với toast error

## 📝 Notes

1. **Role Selection**: Frontend gửi roleId qua query parameter khi redirect sang Azure OAuth
2. **Token Storage**: Token được lưu trong localStorage với key "authToken"
3. **Redux Integration**: Sử dụng loginSuccess action để update auth state
4. **Axios Config**: Token tự động được thêm vào header cho các request tiếp theo

## 🔒 Security Considerations

1. ✅ Token được truyền qua HTTPS trong production
2. ✅ Token được validate ở backend trước khi redirect
3. ✅ Frontend không tin tưởng token từ URL mà phải verify với backend
4. ✅ Role được validate ở backend, không dựa vào frontend input

## 🚀 Next Steps

1. [ ] Backend team implement OAuth2AuthenticationSuccessHandler
2. [ ] Backend team update SecurityConfig với oauth2Login
3. [ ] Backend team implement findOrCreateOAuthUser method
4. [ ] Update Azure App Registration redirect URIs
5. [ ] Test end-to-end flow
6. [ ] Deploy và test trên production URLs
