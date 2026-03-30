package org.gms.server.partyquest;

import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.TypeReference;
import org.gms.config.GameConfig;
import org.gms.net.server.world.PartyCharacter;
import org.gms.util.DatabaseConnection;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * 组队 PQ 副本每日参与次数（复用 bosslog_daily，bosstype = PQ_ 前缀加 Event 脚本名）。
 */
public final class PartyQuestDailyLog {

    private static final String PREFIX = "PQ_";
    private static final int MAX_BOSSTYPE_LEN = 32;

    private PartyQuestDailyLog() {
    }

    public static String bosstypeKey(String eventName) {
        String raw = PREFIX + eventName;
        return raw.length() <= MAX_BOSSTYPE_LEN ? raw : raw.substring(0, MAX_BOSSTYPE_LEN);
    }

    public static boolean isLimitEnabled() {
        return GameConfig.getServerBoolean("pq_daily_limit_enabled");
    }

    public static boolean isExcluded(String eventName) {
        List<String> ex = loadExcludedList();
        return !ex.isEmpty() && ex.contains(eventName);
    }

    /**
     * 是否应对该 Event 应用每日次数（启用、未排除、且上限为有限值）。
     */
    public static boolean isLimitApplicable(String eventName) {
        return isLimitEnabled() && !isExcluded(eventName) && getEffectiveLimit(eventName) != Integer.MAX_VALUE;
    }

    private static List<String> loadExcludedList() {
        String raw = GameConfig.getServerString("pq_daily_limit_excluded");
        if (raw == null || raw.isEmpty()) {
            return Collections.emptyList();
        }
        try {
            return JSON.parseArray(raw, String.class);
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    /**
     * @return 当日允许的最大次数；{@link Integer#MAX_VALUE} 表示不限制
     */
    public static int getEffectiveLimit(String eventName) {
        if (!isLimitEnabled()) {
            return Integer.MAX_VALUE;
        }
        if (isExcluded(eventName)) {
            return Integer.MAX_VALUE;
        }
        int def = GameConfig.getServerInt("pq_daily_limit_default");
        if (def <= 0) {
            def = 5;
        }
        Map<String, Integer> overrides = GameConfig.getServerObject("pq_daily_limit_overrides", new TypeReference<Map<String, Integer>>() {
        });
        if (overrides != null && overrides.containsKey(eventName)) {
            Integer v = overrides.get(eventName);
            if (v == null) {
                return def;
            }
            if (v <= 0) {
                return Integer.MAX_VALUE;
            }
            return v;
        }
        return def;
    }

    public static int countAttempts(int cid, String eventName) {
        String key = bosstypeKey(eventName);
        try (Connection con = DatabaseConnection.getConnection();
             PreparedStatement ps = con.prepareStatement("SELECT COUNT(*) FROM bosslog_daily WHERE characterid = ? AND bosstype = ?")) {
            ps.setInt(1, cid);
            ps.setString(2, key);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt(1);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return -1;
    }

    public static List<PartyCharacter> filterEligible(List<PartyCharacter> eligible, String eventName) {
        if (eligible == null || eligible.isEmpty()) {
            return eligible == null ? Collections.emptyList() : eligible;
        }
        int limit = getEffectiveLimit(eventName);
        if (limit == Integer.MAX_VALUE) {
            return eligible;
        }
        List<PartyCharacter> next = new ArrayList<>();
        for (PartyCharacter pc : eligible) {
            if (pc == null || pc.getPlayer() == null) {
                continue;
            }
            int n = countAttempts(pc.getId(), eventName);
            if (n < 0 || n < limit) {
                next.add(pc);
            }
        }
        return next;
    }

    public static void recordAttempts(Collection<PartyCharacter> members, String eventName) {
        if (members == null || members.isEmpty()) {
            return;
        }
        if (!isLimitEnabled()) {
            return;
        }
        if (isExcluded(eventName)) {
            return;
        }
        if (getEffectiveLimit(eventName) == Integer.MAX_VALUE) {
            return;
        }
        String key = bosstypeKey(eventName);
        Timestamp now = new Timestamp(System.currentTimeMillis());
        for (PartyCharacter pc : members) {
            if (pc == null || pc.getPlayer() == null) {
                continue;
            }
            insertAttempt(pc.getId(), key, now);
        }
    }

    private static void insertAttempt(int cid, String bosstype, Timestamp attemptTime) {
        try (Connection con = DatabaseConnection.getConnection();
             PreparedStatement ps = con.prepareStatement("INSERT INTO bosslog_daily (characterid, bosstype, attempttime) VALUES (?,?,?)")) {
            ps.setInt(1, cid);
            ps.setString(2, bosstype);
            ps.setTimestamp(3, attemptTime);
            ps.executeUpdate();
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }
}
