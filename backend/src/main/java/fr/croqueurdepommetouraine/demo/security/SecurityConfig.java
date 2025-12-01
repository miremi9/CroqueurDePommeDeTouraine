package fr.croqueurdepommetouraine.demo.security;

import fr.croqueurdepommetouraine.demo.security.rules.SecurityRule;
import fr.croqueurdepommetouraine.demo.security.rules.SecurityRules;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtRequestFilter jwtRequestFilter;


    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {

        return config.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }


    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(authorize -> {

                    for (SecurityRule rule : SecurityRules.rules()) {
                        if (rule.permitAll()) {
                            if (rule.method() != null) {
                                authorize.requestMatchers(rule.method(), rule.pattern()).permitAll();
                                System.out.println("Permitting all for " + rule.method() + " " + rule.pattern());
                            } else
                                authorize.requestMatchers(rule.pattern()).permitAll();
                        } else if (rule.roles().length > 0) {
                            if (rule.method() != null)
                                authorize.requestMatchers(rule.method(), rule.pattern()).hasAnyAuthority(rule.roles());
                            else
                                authorize.requestMatchers(rule.pattern()).hasAnyAuthority(rule.roles());
                        } else {
                            authorize.requestMatchers(rule.pattern()).authenticated();
                        }
                    }

                    authorize.anyRequest().authenticated();
                })

                .addFilterBefore(this.jwtRequestFilter, UsernamePasswordAuthenticationFilter.class)

                .build();

    }
}
