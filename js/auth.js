/**
 * ============================================================================
 * js/auth.js — Route Protection, Login, Register (Base64 Avatar) & Profile Modal
 * ============================================================================
 */

(function () {
  const CFG = window.APP_CONFIG;

  let currentUser = null;
  let unitProgressMap = {};
  let miniGameRecordsMap = {};
  let pendingRegisterAvatarBase64 = "";

  function loadStoredSession() {
    try {
      const raw = localStorage.getItem(CFG.STORAGE_KEYS.SESSION_USER);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && parsed.student_id ? parsed : null;
    } catch (e) {
      return null;
    }
  }

  function persistSession(userObj) {
    currentUser = userObj;
    localStorage.setItem(CFG.STORAGE_KEYS.SESSION_USER, JSON.stringify(userObj));
  }

  function clearSession() {
    currentUser = null;
    unitProgressMap = {};
    miniGameRecordsMap = {};
    localStorage.removeItem(CFG.STORAGE_KEYS.SESSION_USER);
  }

  function enforceRouteGuard() {
    const authScreen = document.getElementById("auth-screen");
    const appShell = document.getElementById("app-shell");

    if (!currentUser) {
      if (authScreen) authScreen.classList.remove("hidden");
      if (appShell) appShell.classList.add("hidden");
      return false;
    }

    if (authScreen) authScreen.classList.add("hidden");
    if (appShell) appShell.classList.remove("hidden");
    renderNavbarProfile();
    return true;
  }

  function renderNavbarProfile() {
    if (!currentUser) return;
    const fallbackAvatar = window.AppUtils.buildInitialsAvatarDataUrl(
      currentUser.full_name
    );

    const navAvatar = document.getElementById("navbar-avatar-img");
    const navName = document.getElementById("navbar-user-name");
    const navId = document.getElementById("navbar-user-id");

    if (navAvatar) {
      navAvatar.src = currentUser.avatar_url || fallbackAvatar;
      navAvatar.onerror = () => {
        navAvatar.onerror = null;
        navAvatar.src = fallbackAvatar;
      };
    }
    if (navName) navName.textContent = currentUser.full_name;
    if (navId) navId.textContent = currentUser.student_id;
  }

  function setFormAlert(elId, message, type = "error") {
    const el = document.getElementById(elId);
    if (!el) return;
    if (!message) {
      el.classList.add("hidden");
      el.textContent = "";
      return;
    }
    el.className = `form-alert ${type === "success" ? "is-success" : "is-error"}`;
    el.textContent = message;
    if (type !== "success") {
      window.MotionEngine?.shakeElement(el);
      window.SoundEngine?.playError();
    }
  }

  function switchAuthMode(mode) {
    window.SoundEngine?.playPop();
    const loginTab = document.getElementById("tab-btn-login");
    const regTab = document.getElementById("tab-btn-register");
    const loginForm = document.getElementById("login-form");
    const regForm = document.getElementById("register-form");
    const authHeading = document.getElementById("auth-pane-heading");
    const authSub = document.getElementById("auth-pane-subtitle");

    setFormAlert("login-alert", "");
    setFormAlert("register-alert", "");

    if (mode === "register") {
      loginTab?.classList.remove("is-active");
      regTab?.classList.add("is-active");
      loginForm?.classList.add("hidden");
      regForm?.classList.remove("hidden");
      window.MotionEngine?.animateViewEnter(regForm);
      window.MotionEngine?.syncAllFloatingFields(regForm);
      if (authHeading) authHeading.textContent = "ลงทะเบียนผู้เรียนใหม่";
      if (authSub) {
        authSub.textContent =
          "กรอกข้อมูลรหัสนักเรียน ชื่อ-นามสกุล และอัปโหลดรูปโปรไฟล์เพื่อเริ่มต้นใช้งาน";
      }
    } else {
      regTab?.classList.remove("is-active");
      loginTab?.classList.add("is-active");
      regForm?.classList.add("hidden");
      loginForm?.classList.remove("hidden");
      window.MotionEngine?.animateViewEnter(loginForm);
      window.MotionEngine?.syncAllFloatingFields(loginForm);
      if (authHeading) authHeading.textContent = "เข้าสู่ระบบผู้เรียน";
      if (authSub) {
        authSub.textContent =
          "ลงชื่อเข้าใช้ด้วยรหัสนักเรียนและรหัสผ่านเพื่อซิงก์ความคืบหน้าการเรียน";
      }
    }
  }

  /* ==========================================================================
     PROFILE & CHANGE PASSWORD MODAL
     ========================================================================== */

  function openProfileModal() {
    if (!currentUser) return;
    const modal = document.getElementById("profile-modal");
    if (!modal) return;

    const fallbackAvatar = window.AppUtils.buildInitialsAvatarDataUrl(
      currentUser.full_name
    );

    const modalAvatar = document.getElementById("modal-profile-avatar");
    const modalName = document.getElementById("modal-profile-name");
    const modalId = document.getElementById("modal-profile-id");
    const modalProgress = document.getElementById("modal-profile-progress");
    const modalScore = document.getElementById("modal-profile-score");
    const modalTime = document.getElementById("modal-profile-time");

    if (modalAvatar) {
      modalAvatar.src = currentUser.avatar_url || fallbackAvatar;
      modalAvatar.onerror = () => {
        modalAvatar.onerror = null;
        modalAvatar.src = fallbackAvatar;
      };
    }
    if (modalName) modalName.textContent = currentUser.full_name;
    if (modalId) modalId.textContent = `รหัสนักเรียน: ${currentUser.student_id}`;
    if (modalProgress) {
      modalProgress.textContent = `${currentUser.passed_units_count} / ${CFG.TOTAL_UNITS} หน่วย (${currentUser.progress_percent}%)`;
    }
    if (modalScore) {
      modalScore.textContent = `${currentUser.grand_total_score} คะแนน`;
    }
    if (modalTime) {
      modalTime.textContent = `${window.AppUtils.formatDuration(currentUser.total_time_sec)} นาที`;
    }

    const pwdForm = document.getElementById("change-password-form");
    if (pwdForm) pwdForm.reset();
    setFormAlert("profile-modal-alert", "");

    if (window.MotionEngine) {
      window.MotionEngine.animateModalOpen(modal);
    } else {
      modal.classList.remove("hidden");
    }
  }

  function closeProfileModal() {
    const modal = document.getElementById("profile-modal");
    if (modal) modal.classList.add("hidden");
  }

  /* ==========================================================================
     EVENT BINDINGS
     ========================================================================== */

  function bindAuthEvents() {
    document
      .getElementById("tab-btn-login")
      ?.addEventListener("click", () => switchAuthMode("login"));
    document
      .getElementById("tab-btn-register")
      ?.addEventListener("click", () => switchAuthMode("register"));

    // Show / Hide password toggles
    document.querySelectorAll("[data-toggle-pwd]").forEach((btn) => {
      btn.addEventListener("click", () => {
        window.SoundEngine?.playToggle();
        const targetId = btn.getAttribute("data-toggle-pwd");
        const input = document.getElementById(targetId);
        if (!input) return;
        const isPwd = input.type === "password";
        input.type = isPwd ? "text" : "password";
        btn.setAttribute("aria-label", isPwd ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน");
      });
    });

    // Register Avatar File Input
    const regAvatarInput = document.getElementById("reg-avatar-input");
    const regAvatarPreview = document.getElementById("reg-avatar-preview-img");
    const regAvatarPlaceholder = document.getElementById("reg-avatar-placeholder");
    const regAvatarFilename = document.getElementById("reg-avatar-filename");

    regAvatarInput?.addEventListener("change", async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      try {
        setFormAlert("register-alert", "");
        const base64 = await window.BackendAPI.compressImageToBase64(file);
        pendingRegisterAvatarBase64 = base64;

        if (regAvatarPreview) {
          regAvatarPreview.src = base64;
          regAvatarPreview.classList.remove("hidden");
        }
        if (regAvatarPlaceholder) {
          regAvatarPlaceholder.classList.add("hidden");
        }
        if (regAvatarFilename) {
          regAvatarFilename.textContent = `เลือกไฟล์แล้ว: ${file.name}`;
        }
      } catch (err) {
        setFormAlert("register-alert", err.message || "อัปโหลดรูปภาพไม่สำเร็จ");
      }
    });

    // Login Submit
    const loginForm = document.getElementById("login-form");
    loginForm?.addEventListener("submit", async (e) => {
      e.preventDefault();
      setFormAlert("login-alert", "");

      const studentId = document.getElementById("login-student-id")?.value.trim() || "";
      const password = document.getElementById("login-password")?.value || "";
      const submitBtn = document.getElementById("login-submit-btn");

      if (!studentId || !password) {
        setFormAlert("login-alert", "กรุณากรอกรหัสนักเรียนและรหัสผ่าน");
        return;
      }

      try {
        if (window.MotionEngine) {
          window.MotionEngine.setButtonLoading(submitBtn, true, "กำลังตรวจสอบข้อมูล...");
        } else if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = "กำลังตรวจสอบข้อมูล...";
        }

        const res = await window.BackendAPI.login({
          student_id: studentId,
          password: password
        });

        if (!res || !res.ok) {
          setFormAlert("login-alert", (res && res.error) || "เข้าสู่ระบบไม่สำเร็จ");
          return;
        }

        unitProgressMap = res.unit_progress || {};
        miniGameRecordsMap = res.minigame_records || {};
        persistSession(res.user);
        enforceRouteGuard();
        window.SoundEngine?.playSuccess();

        if (window.AppController && typeof window.AppController.onAuthSuccess === "function") {
          window.AppController.onAuthSuccess();
        }
        window.AppUtils.showToast(`ยินดีต้อนรับ ${res.user.full_name}`, "success");
      } catch (err) {
        setFormAlert("login-alert", err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ");
      } finally {
        if (window.MotionEngine) {
          window.MotionEngine.setButtonLoading(submitBtn, false);
        } else if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "เข้าสู่ระบบ";
        }
      }
    });

    // Register Submit
    const registerForm = document.getElementById("register-form");
    registerForm?.addEventListener("submit", async (e) => {
      e.preventDefault();
      setFormAlert("register-alert", "");

      const studentId = document.getElementById("reg-student-id")?.value.trim() || "";
      const fullName = document.getElementById("reg-full-name")?.value.trim() || "";
      const password = document.getElementById("reg-password")?.value || "";
      const confirmPwd = document.getElementById("reg-confirm-password")?.value || "";
      const submitBtn = document.getElementById("register-submit-btn");

      if (!pendingRegisterAvatarBase64) {
        setFormAlert("register-alert", "กรุณาอัปโหลดรูปโปรไฟล์ก่อนสมัครสมาชิก");
        return;
      }
      if (!studentId || studentId.length < 3) {
        setFormAlert("register-alert", "กรุณากรอกรหัสนักเรียนอย่างน้อย 3 ตัวอักษร");
        return;
      }
      if (!fullName) {
        setFormAlert("register-alert", "กรุณากรอกชื่อ-นามสกุลจริง");
        return;
      }
      if (password.length < 4) {
        setFormAlert("register-alert", "รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร");
        return;
      }
      if (password !== confirmPwd) {
        setFormAlert("register-alert", "รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน");
        return;
      }

      try {
        if (window.MotionEngine) {
          window.MotionEngine.setButtonLoading(submitBtn, true, "กำลังบันทึกข้อมูลและอัปโหลดรูป...");
        } else if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = "กำลังบันทึกข้อมูลและอัปโหลดรูป...";
        }

        const res = await window.BackendAPI.register({
          student_id: studentId,
          full_name: fullName,
          password: password,
          avatar_base64: pendingRegisterAvatarBase64
        });

        if (!res || !res.ok) {
          setFormAlert("register-alert", (res && res.error) || "สมัครสมาชิกไม่สำเร็จ");
          return;
        }

        unitProgressMap = res.unit_progress || {};
        miniGameRecordsMap = res.minigame_records || {};
        persistSession(res.user);
        registerForm.reset();
        window.MotionEngine?.syncAllFloatingFields(registerForm);
        pendingRegisterAvatarBase64 = "";
        enforceRouteGuard();
        window.SoundEngine?.playSuccess();

        if (window.AppController && typeof window.AppController.onAuthSuccess === "function") {
          window.AppController.onAuthSuccess();
        }
        window.AppUtils.showToast("สมัครสมาชิกและเข้าสู่ระบบสำเร็จ", "success");
      } catch (err) {
        setFormAlert("register-alert", err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ");
      } finally {
        if (window.MotionEngine) {
          window.MotionEngine.setButtonLoading(submitBtn, false);
        } else if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "สมัครสมาชิกและเริ่มเรียน";
        }
      }
    });

    // Navbar Profile Modal Triggers
    document
      .getElementById("navbar-profile-btn")
      ?.addEventListener("click", openProfileModal);
    document
      .getElementById("close-profile-modal-btn")
      ?.addEventListener("click", closeProfileModal);
    document.getElementById("profile-modal")?.addEventListener("click", (e) => {
      if (e.target && e.target.id === "profile-modal") {
        closeProfileModal();
      }
    });

    // Update Avatar inside Profile Modal
    const modalAvatarInput = document.getElementById("modal-avatar-upload-input");
    modalAvatarInput?.addEventListener("change", async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file || !currentUser) return;
      try {
        setFormAlert("profile-modal-alert", "");
        const base64 = await window.BackendAPI.compressImageToBase64(file);
        const res = await window.BackendAPI.updateProfile({
          student_id: currentUser.student_id,
          avatar_base64: base64
        });
        if (!res || !res.ok) {
          setFormAlert("profile-modal-alert", (res && res.error) || "อัปเดตรูปไม่สำเร็จ");
          return;
        }
        persistSession(res.user);
        renderNavbarProfile();
        openProfileModal();
        if (window.AppController && typeof window.AppController.refreshActiveView === "function") {
          window.AppController.refreshActiveView();
        }
        window.AppUtils.showToast("อัปเดตรูปโปรไฟล์เรียบร้อยแล้ว", "success");
      } catch (err) {
        setFormAlert("profile-modal-alert", err.message || "เกิดข้อผิดพลาด");
      }
    });

    // Change Password Submit
    const changePwdForm = document.getElementById("change-password-form");
    changePwdForm?.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!currentUser) return;
      setFormAlert("profile-modal-alert", "");

      const curPwd = document.getElementById("pwd-current")?.value || "";
      const newPwd = document.getElementById("pwd-new")?.value || "";
      const confPwd = document.getElementById("pwd-confirm")?.value || "";
      const btn = document.getElementById("pwd-submit-btn");

      if (!curPwd || !newPwd || !confPwd) {
        setFormAlert("profile-modal-alert", "กรุณากรอกข้อมูลรหัสผ่านให้ครบทุกช่อง");
        return;
      }
      if (newPwd.length < 4) {
        setFormAlert("profile-modal-alert", "รหัสผ่านใหม่ต้องมีอย่างน้อย 4 ตัวอักษร");
        return;
      }
      if (newPwd !== confPwd) {
        setFormAlert("profile-modal-alert", "รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน");
        return;
      }

      try {
        if (window.MotionEngine) {
          window.MotionEngine.setButtonLoading(btn, true, "กำลังบันทึกรหัสผ่านใหม่...");
        } else if (btn) {
          btn.disabled = true;
          btn.textContent = "กำลังบันทึกรหัสผ่านใหม่...";
        }
        const res = await window.BackendAPI.changePassword({
          student_id: currentUser.student_id,
          current_password: curPwd,
          new_password: newPwd
        });
        if (!res || !res.ok) {
          setFormAlert("profile-modal-alert", (res && res.error) || "เปลี่ยนรหัสผ่านไม่สำเร็จ");
          return;
        }
        changePwdForm.reset();
        window.MotionEngine?.syncAllFloatingFields(changePwdForm);
        setFormAlert("profile-modal-alert", "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว", "success");
        window.AppUtils.showToast("เปลี่ยนรหัสผ่านสำเร็จ", "success");
      } catch (err) {
        setFormAlert("profile-modal-alert", err.message || "เกิดข้อผิดพลาด");
      } finally {
        if (window.MotionEngine) {
          window.MotionEngine.setButtonLoading(btn, false);
        } else if (btn) {
          btn.disabled = false;
          btn.textContent = "บันทึกรหัสผ่านใหม่";
        }
      }
    });

    // Logout Button
    document.getElementById("logout-btn")?.addEventListener("click", () => {
      closeProfileModal();
      clearSession();
      switchAuthMode("login");
      enforceRouteGuard();
      window.AppUtils.showToast("ออกจากระบบเรียบร้อยแล้ว", "info");
    });
  }

  async function initAuth() {
    bindAuthEvents();
    const cached = loadStoredSession();
    if (!cached) {
      enforceRouteGuard();
      return false;
    }

    currentUser = cached;
    enforceRouteGuard();

    // ซิงก์ข้อมูลล่าสุดจากเซิร์ฟเวอร์เบื้องหลัง
    try {
      const res = await window.BackendAPI.getSession(cached.student_id);
      if (res && res.ok && res.user) {
        unitProgressMap = res.unit_progress || {};
        miniGameRecordsMap = res.minigame_records || {};
        persistSession(res.user);
        renderNavbarProfile();
      } else {
        clearSession();
        enforceRouteGuard();
        return false;
      }
    } catch (e) {
      // กรณีออฟไลน์ชั่วคราว ใช้ข้อมูลแคชล่าสุดต่อได้
    }
    return true;
  }

  window.AuthManager = {
    initAuth,
    isAuthenticated: () => Boolean(currentUser),
    getCurrentUser: () => currentUser,
    getUnitProgressMap: () => unitProgressMap,
    getMiniGameRecordsMap: () => miniGameRecordsMap,
    updateSessionData(user, unitMap, gameMap) {
      if (user) persistSession(user);
      if (unitMap) unitProgressMap = unitMap;
      if (gameMap) miniGameRecordsMap = gameMap;
      renderNavbarProfile();
      if (window.AppController && typeof window.AppController.refreshActiveView === "function") {
        window.AppController.refreshActiveView();
      }
    },
    enforceRouteGuard,
    openProfileModal
  };
})();
