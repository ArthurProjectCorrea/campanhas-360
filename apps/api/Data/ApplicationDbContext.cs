using Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using System;

namespace Api.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Client> Clients { get; set; }
    public DbSet<AccessProfile> AccessProfiles { get; set; }
    public DbSet<Screen> Screens { get; set; }
    public DbSet<Permission> Permissions { get; set; }
    public DbSet<Access> Accesses { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Client>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired();
            entity.Property(e => e.Domain).IsRequired();
        });

        builder.Entity<AccessProfile>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired();
            entity.HasOne(d => d.Client)
                .WithMany(p => p.AccessProfiles)
                .HasForeignKey(d => d.ClientId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Screen>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedNever(); // IDs coming from JSON
            entity.Property(e => e.Key).IsRequired();
            entity.HasIndex(e => e.Key).IsUnique();
        });

        builder.Entity<Permission>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedNever(); // IDs coming from JSON
            entity.Property(e => e.Key).IsRequired();
            entity.HasIndex(e => e.Key).IsUnique();
        });

        builder.Entity<Access>(entity =>
        {
            entity.HasKey(e => new { e.AccessProfileId, e.ScreenId, e.PermissionId });

            entity.HasOne(d => d.AccessProfile)
                .WithMany(p => p.Accesses)
                .HasForeignKey(d => d.AccessProfileId);

            entity.HasOne(d => d.Screen)
                .WithMany(p => p.Accesses)
                .HasForeignKey(d => d.ScreenId);

            entity.HasOne(d => d.Permission)
                .WithMany(p => p.Accesses)
                .HasForeignKey(d => d.PermissionId);
        });

        builder.Entity<ApplicationUser>(entity =>
        {
            entity.HasOne(d => d.Client)
                .WithMany(p => p.Users)
                .HasForeignKey(d => d.ClientId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(d => d.AccessProfile)
                .WithMany(p => p.Users)
                .HasForeignKey(d => d.AccessProfileId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
