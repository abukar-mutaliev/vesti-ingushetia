const { Profile } = require("../models");
const { User } = require("../models");

exports.createProfile = async (req, res) => {
  const { userId, avatarUrl, bio } = req.body;

  if (!userId) {
    return res
      .status(400)
      .json({ error: "Не указан пользователь для профиля" });
  }

  try {
    const userExists = await User.findByPk(userId);
    if (!userExists) {
      return res.status(400).json({ error: "Пользователь не существует" });
    }

    const baseUrl = process.env.BASE_URL;
    const fullAvatarUrl = avatarUrl
      ? `${baseUrl}/${posix.join("uploads", "avatars", avatarUrl)}`
      : null;

    const profile = await Profile.create({
      userId,
      avatarUrl: fullAvatarUrl,
      bio,
    });
    res.status(201).json(profile);
  } catch (err) {
    res.status(500).json({ error: `Ошибка создания профиля: ${err.message}` });
  }
};

exports.getProfileById = async (req, res) => {
  const { id } = req.params;

  try {
    const profile = await Profile.findByPk(id, {
      include: ["user"],
    });

    if (!profile) {
      return res.status(404).json({ error: "Профиль не найден" });
    }

    const baseUrl = process.env.BASE_URL;

    const avatarUrl = profile.avatarUrl
      ? `${baseUrl}${profile.avatarUrl}`
      : null;

    res.json({ profile, avatarUrl });
  } catch (err) {
    res.status(500).json({ error: `Ошибка получения профиля: ${err.message}` });
  }
};

exports.updateProfile = async (req, res) => {
  const { id } = req.params;
  const { avatarUrl, bio } = req.body;

  try {
    const profile = await Profile.findByPk(id);

    if (!profile) {
      return res.status(404).json({ error: "Профиль не найден" });
    }

    const baseUrl = process.env.BASE_URL;
    let fullAvatarUrl = profile.avatarUrl;

    if (avatarUrl && avatarUrl !== profile.avatarUrl) {
      if (profile.avatarUrl) {
        const oldAvatarPath = path.join(
          __dirname,
          "..",
          profile.avatarUrl.replace(`${baseUrl}/`, "")
        );
        fs.unlink(oldAvatarPath, (err) => {
          if (err) {
            console.error("Ошибка при удалении старого аватара:", err);
          }
        });
      }

      fullAvatarUrl = `${baseUrl}/${posix.join(
        "uploads",
        "avatars",
        avatarUrl
      )}`;
    }

    await profile.update({ avatarUrl: fullAvatarUrl, bio });

    res.status(200).json({ message: "Профиль успешно обновлен", profile });
  } catch (err) {
    res
      .status(500)
      .json({ error: `Ошибка обновления профиля: ${err.message}` });
  }
};

exports.deleteProfile = async (req, res) => {
  const { id } = req.params;

  try {
    const profile = await Profile.findByPk(id);

    if (!profile) {
      return res.status(404).json({ error: "Профиль не найден" });
    }

    if (profile.avatarUrl) {
      const baseUrl = process.env.BASE_URL;
      const avatarPath = path.join(
        __dirname,
        "..",
        profile.avatarUrl.replace(`${baseUrl}/`, "")
      );
      fs.unlink(avatarPath, (err) => {
        if (err) {
          console.error("Ошибка при удалении аватара:", err);
        }
      });
    }

    await profile.destroy();
    res.status(200).json({ message: "Профиль успешно удален" });
  } catch (err) {
    res.status(500).json({ error: `Ошибка удаления профиля: ${err.message}` });
  }
};
